import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type {
  AdjudicatorLeaderboardEntry,
  SpeakerLeaderboardResponse,
  ParticipantCompatibilityProfile,
  ParticipantMetricDetail,
  ParticipantMotionTypeScore,
  ParticipantProgressProfile,
  ParticipantProgressSummary,
  ParticipantRoleScore,
} from "../../../types/scoring.ts";
import type { MemberId } from "../../../types/pairing.ts";
import { resolveParticipantId } from "./metrics-repository.ts";

type ScoringRepositoryClient = PrismaClient;

type ParticipantType = "member" | "cabinet" | "president";

function buildParticipantRef(participantId: MemberId, participantType: ParticipantType) {
  return {
    memberId: participantType === "member" ? participantId : null,
    cabinetId: participantType === "cabinet" ? participantId : null,
    presidentId: participantType === "president" ? participantId : null,
  };
}

export function createScoringRepository(client: ScoringRepositoryClient = prisma) {
  async function loadProgressSummaryMetrics(participantId: MemberId) {
    return client.memberMetricSnapshot.findMany({
      where: {
        OR: [{ memberId: participantId }, { cabinetId: participantId }, { presidentId: participantId }],
      },
      select: {
        metricKey: true,
        value: true,
        confidence: true,
        observationCount: true,
      },
    });
  }

  type RoleAssignmentCounts = { spoken: number; adjudicated: number; chaired: number };

  function buildProgressSummaryFromMetrics(
    participantId: MemberId,
    metrics: Array<{ metricKey: string; value: number; confidence: number; observationCount: number }>,
    assignmentCounts: RoleAssignmentCounts = { spoken: 0, adjudicated: 0, chaired: 0 },
  ): ParticipantProgressSummary {
    const byMetric = new Map(metrics.map((metric: (typeof metrics)[number]) => [metric.metricKey, metric]));
    const speakerStrengthConfidence = byMetric.get("speaker_strength")?.confidence ?? 0;

    return {
      participantId,
      speakerTotalScore: byMetric.get("speaker_total_score")?.value ?? 0,
      speakerStrength: byMetric.get("speaker_strength")?.value ?? 0,
      confidence: speakerStrengthConfidence,
      // Spoken counts every session the participant was paired as a speaker
      // (scored or not). The scored count below is what confidence/maturity are
      // actually built from, so it can be lower than sessionsSpoken.
      sessionsSpoken: assignmentCounts.spoken,
      sessionsAdjudicated: byMetric.get("adjudicator_average_score")?.observationCount ?? 0,
      sessionsChaired: byMetric.get("chair_score")?.observationCount ?? 0,
      scoredSpeakerSessions: byMetric.get("speaker_total_score")?.observationCount ?? 0,
      dataMaturity: speakerStrengthConfidence >= 0.8 ? "HIGH" : speakerStrengthConfidence >= 0.4 ? "MEDIUM" : "LOW",
    };
  }

  // Counts sessions the participant was paired as a speaker, from the session
  // role assignments (one row per participant per session), independent of
  // whether a chair has scored the room yet. Adjudicated/chaired stay on their
  // scored-metric sources because SessionRoleAssignment does not record which
  // adjudicator chaired (chair is decided later, in RoomAdjudicatorAssignment).
  async function getRoleAssignmentCounts(participantId: MemberId): Promise<RoleAssignmentCounts> {
    const spoken = await client.sessionRoleAssignment.count({
      where: {
        role: "speaker",
        OR: [{ memberId: participantId }, { cabinetId: participantId }, { presidentId: participantId }],
      },
    });
    return { spoken, adjudicated: 0, chaired: 0 };
  }

  async function getPublishedScoringContext(sessionId: string) {
    const session = await client.debateSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        motionType: true,
        motiontype: true,
        publicationStatus: true,
        publishedProposalId: true,
        sessionRoleAssignments: {
          select: {
            memberId: true,
            cabinetId: true,
            presidentId: true,
            role: true,
            isChair: true,
          },
        },
        publishedProposal: {
          select: {
            roomAssignments: {
              select: {
                roomIndex: true,
                teamAssignments: {
                  select: {
                    id: true,
                    bpPosition: true,
                    speakerAssignments: {
                      select: {
                        memberId: true,
                        cabinetId: true,
                        presidentId: true,
                        speakingRole: true,
                      },
                      orderBy: { speakerOrder: "asc" },
                    },
                  },
                  orderBy: { bpPosition: "asc" },
                },
                adjudicatorAssignments: {
                  select: {
                    memberId: true,
                    cabinetId: true,
                    presidentId: true,
                    isChair: true,
                  },
                },
              },
              orderBy: { roomIndex: "asc" },
            },
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      sessionId: session.id,
      proposalId: session.publishedProposalId,
      motionType: session.motionType ?? session.motiontype,
      publicationStatus: session.publicationStatus ?? "draft",
      roles: session.sessionRoleAssignments.map((assignment: { memberId: string | null; cabinetId: string | null; presidentId: string | null; role: string; isChair: boolean }) => ({
        participantId: resolveParticipantId(assignment),
        role: assignment.role,
        isChair: assignment.isChair,
      })),
      rooms:
        session.publishedProposal?.roomAssignments.map((room: { roomIndex: number; teamAssignments: Array<{ id: string; bpPosition: string; speakerAssignments: Array<{ memberId: string | null; cabinetId: string | null; presidentId: string | null; speakingRole: string }> }>; adjudicatorAssignments: Array<{ memberId: string | null; cabinetId: string | null; presidentId: string | null; isChair: boolean }> }) => ({
          roomIndex: room.roomIndex,
          speakers: room.teamAssignments.flatMap((team: { id: string; bpPosition: string; speakerAssignments: Array<{ memberId: string | null; cabinetId: string | null; presidentId: string | null; speakingRole: string }> }) =>
            team.speakerAssignments.map((speaker: { memberId: string | null; cabinetId: string | null; presidentId: string | null; speakingRole: string }) => ({
              participantId: resolveParticipantId(speaker),
              teamAssignmentId: team.id,
              bpPosition: team.bpPosition,
              speakingRole: speaker.speakingRole,
            })),
          ),
          adjudicators: room.adjudicatorAssignments.map((adjudicator: { memberId: string | null; cabinetId: string | null; presidentId: string | null; isChair: boolean }) => ({
            participantId: resolveParticipantId(adjudicator),
            isChair: adjudicator.isChair,
          })),
        })) ?? [],
    };
  }

  // Lightweight variant for the realtime connect path: the realtime hub only
  // needs the set of published-scoring participant IDs to authorize a non-admin
  // SESSION_SCORING subscription. Selecting only the role assignments avoids the
  // full nested published-proposal tree that getPublishedScoringContext fetches,
  // keeping this off the WS/SSE bootstrap's critical path.
  async function getPublishedScoringParticipantIds(sessionId: string): Promise<string[]> {
    const session = await client.debateSession.findUnique({
      where: { id: sessionId },
      select: {
        sessionRoleAssignments: {
          select: { memberId: true, cabinetId: true, presidentId: true },
        },
      },
    });

    if (!session) {
      return [];
    }

    const participantIds = session.sessionRoleAssignments
      .map((assignment: { memberId: string | null; cabinetId: string | null; presidentId: string | null }) =>
        String(resolveParticipantId(assignment)),
      )
      .filter((id: string) => id.length > 0);

    return Array.from(new Set<string>(participantIds));
  }

  async function createSpeakerScoreRecords(
    sessionId: string,
    proposalId: string,
    records: Array<{
      participantId: MemberId;
      participantType: ParticipantType;
      teamAssignmentId?: string | null;
      bpPosition: string;
      speakingRole: string;
      rawScore: number;
      teamResultPoints: number;
      scoredByParticipantId: MemberId;
      scoredByParticipantType: ParticipantType;
    }>,
  ) {
    if (records.length === 0) {
      return { count: 0 };
    }

    return client.speakerScoreRecord.createMany({
      data: records.map((record) => ({
        sessionId,
        proposalId,
        teamAssignmentId: record.teamAssignmentId ?? null,
        bpPosition: record.bpPosition,
        speakingRole: record.speakingRole,
        rawScore: record.rawScore,
        teamResultPoints: record.teamResultPoints,
        ...buildParticipantRef(record.participantId, record.participantType),
        scoredByMemberId: record.scoredByParticipantType === "member" ? record.scoredByParticipantId : null,
        scoredByCabinetId: record.scoredByParticipantType === "cabinet" ? record.scoredByParticipantId : null,
        scoredByPresidentId: record.scoredByParticipantType === "president" ? record.scoredByParticipantId : null,
      })),
    });
  }

  async function getExistingSpeakerScoreRecords(sessionId: string, scoredByParticipantId: MemberId) {
    return client.speakerScoreRecord.findMany({
      where: {
        sessionId,
        OR: [
          { scoredByMemberId: scoredByParticipantId },
          { scoredByCabinetId: scoredByParticipantId },
          { scoredByPresidentId: scoredByParticipantId },
        ],
      },
      select: {
        memberId: true,
        cabinetId: true,
        presidentId: true,
        bpPosition: true,
        speakingRole: true,
        rawScore: true,
        teamResultPoints: true,
      },
      orderBy: [{ memberId: "asc" }, { cabinetId: "asc" }, { presidentId: "asc" }],
    });
  }

  async function getSpeakerScoreRecordsBySession(sessionId: string) {
    return client.speakerScoreRecord.findMany({
      where: { sessionId },
      select: {
        sessionId: true,
        memberId: true,
        cabinetId: true,
        presidentId: true,
        teamAssignmentId: true,
        scoredByMemberId: true,
        scoredByCabinetId: true,
        scoredByPresidentId: true,
        bpPosition: true,
        speakingRole: true,
        rawScore: true,
        teamResultPoints: true,
        session: {
          select: {
            motionType: true,
            motiontype: true,
          },
        },
      },
    });
  }


  async function getSpeakerScoreRecordsForParticipants(participantIds: MemberId[]) {
    if (participantIds.length === 0) {
      return [];
    }

    return client.speakerScoreRecord.findMany({
      where: {
        OR: [
          { memberId: { in: participantIds } },
          { cabinetId: { in: participantIds } },
          { presidentId: { in: participantIds } },
        ],
      },
      select: {
        sessionId: true,
        memberId: true,
        cabinetId: true,
        presidentId: true,
        teamAssignmentId: true,
        scoredByMemberId: true,
        scoredByCabinetId: true,
        scoredByPresidentId: true,
        bpPosition: true,
        speakingRole: true,
        rawScore: true,
        teamResultPoints: true,
        session: {
          select: {
            motionType: true,
            motiontype: true,
          },
        },
      },
    });
  }

  async function getSparSpeakerScoresForParticipants(participantIds: MemberId[]) {
    if (participantIds.length === 0) {
      return [];
    }

    const records = await client.sparRecord.findMany({
      where: {
        OR: [
          { memberId: { in: participantIds } },
          { cabinetId: { in: participantIds } },
          { presidentId: { in: participantIds } },
        ],
      },
      select: {
        id: true,
        sparDate: true,
        motionType: true,
        debateFormat: true,
        bpPosition: true,
        apSide: true,
        teamResultPoints: true,
        memberId: true,
        cabinetId: true,
        presidentId: true,
        sparSpeakerScores: { select: { speakingRole: true, speakerScore: true } },
      },
    });

    return records.flatMap((record: { id: string; sparDate: Date; motionType: string; debateFormat: string; bpPosition: string | null; apSide: string | null; teamResultPoints: number; memberId: string | null; cabinetId: string | null; presidentId: string | null; sparSpeakerScores: Array<{ speakingRole: string; speakerScore: number }> }) =>
      record.sparSpeakerScores.map((score: { speakingRole: string; speakerScore: number }) => ({
        sparRecordId: record.id,
        sparDate: record.sparDate,
        motionType: record.motionType,
        debateFormat: record.debateFormat || "BP",
        bpPosition: record.bpPosition,
        apSide: record.apSide,
        teamResultPoints: record.teamResultPoints,
        memberId: record.memberId,
        cabinetId: record.cabinetId,
        presidentId: record.presidentId,
        speakingRole: score.speakingRole,
        speakerScore: score.speakerScore,
      })),
    );
  }

  async function getSparRecordForMetricUpdate(sparRecordId: string) {
    return client.sparRecord.findUnique({
      where: { id: sparRecordId },
      select: {
        id: true,
        motionType: true,
        debateFormat: true,
        bpPosition: true,
        apSide: true,
        teamResultPoints: true,
        isIronMan: true,
        memberId: true,
        cabinetId: true,
        presidentId: true,
        teammateMemberId: true,
        teammateCabinetId: true,
        teammatePresidentId: true,
        sparTeammates: { select: { memberId: true, cabinetId: true, presidentId: true } },
        sparSpeakerScores: { select: { speakingRole: true, speakerScore: true } },
      },
    });
  }

  async function getSparRecordsByTeammate(participantIdA: MemberId, participantIdB: MemberId) {
    return client.sparRecord.findMany({
      where: {
        isIronMan: false,
        OR: [
          {
            OR: [{ memberId: participantIdA }, { cabinetId: participantIdA }, { presidentId: participantIdA }],
            AND: [{ OR: [{ teammateMemberId: participantIdB }, { teammateCabinetId: participantIdB }, { teammatePresidentId: participantIdB }, { sparTeammates: { some: { OR: [{ memberId: participantIdB }, { cabinetId: participantIdB }, { presidentId: participantIdB }] } } }] }],
          },
          {
            OR: [{ memberId: participantIdB }, { cabinetId: participantIdB }, { presidentId: participantIdB }],
            AND: [{ OR: [{ teammateMemberId: participantIdA }, { teammateCabinetId: participantIdA }, { teammatePresidentId: participantIdA }, { sparTeammates: { some: { OR: [{ memberId: participantIdA }, { cabinetId: participantIdA }, { presidentId: participantIdA }] } } }] }],
          },
        ],
      },
      select: {
        motionType: true,
        debateFormat: true,
        teamResultPoints: true,
        memberId: true,
        cabinetId: true,
        presidentId: true,
        teammateMemberId: true,
        teammateCabinetId: true,
        teammatePresidentId: true,
        sparTeammates: { select: { memberId: true, cabinetId: true, presidentId: true } },
      },
    });
  }

  async function createChairFeedbackRecord(input: {
    sessionId: string;
    proposalId: string;
    speakerParticipantId: MemberId;
    speakerParticipantType: ParticipantType;
    chairParticipantId: MemberId;
    chairParticipantType: ParticipantType;
    rating: number;
    notes?: string | null;
  }) {
    return client.chairFeedbackRecord.create({
      data: {
        sessionId: input.sessionId,
        proposalId: input.proposalId,
        speakerMemberId: input.speakerParticipantType === "member" ? input.speakerParticipantId : null,
        speakerCabinetId: input.speakerParticipantType === "cabinet" ? input.speakerParticipantId : null,
        speakerPresidentId: input.speakerParticipantType === "president" ? input.speakerParticipantId : null,
        chairMemberId: input.chairParticipantType === "member" ? input.chairParticipantId : null,
        chairCabinetId: input.chairParticipantType === "cabinet" ? input.chairParticipantId : null,
        chairPresidentId: input.chairParticipantType === "president" ? input.chairParticipantId : null,
        rating: input.rating,
        notes: input.notes ?? null,
      },
      select: { id: true },
    });
  }

  async function getChairFeedbackBySpeaker(sessionId: string, speakerParticipantId: MemberId) {
    return client.chairFeedbackRecord.findFirst({
      where: {
        sessionId,
        OR: [
          { speakerMemberId: speakerParticipantId },
          { speakerCabinetId: speakerParticipantId },
          { speakerPresidentId: speakerParticipantId },
        ],
      },
      select: {
        chairMemberId: true,
        chairCabinetId: true,
        chairPresidentId: true,
        rating: true,
        notes: true,
      },
    });
  }

  async function getChairFeedbackBySession(sessionId: string) {
    return client.chairFeedbackRecord.findMany({
      where: { sessionId },
      select: {
        sessionId: true,
        speakerMemberId: true,
        speakerCabinetId: true,
        speakerPresidentId: true,
        chairMemberId: true,
        chairCabinetId: true,
        chairPresidentId: true,
        rating: true,
      },
    });
  }


  async function getChairFeedbackForChairs(participantIds: MemberId[]) {
    if (participantIds.length === 0) {
      return [];
    }

    return client.chairFeedbackRecord.findMany({
      where: {
        OR: [
          { chairMemberId: { in: participantIds } },
          { chairCabinetId: { in: participantIds } },
          { chairPresidentId: { in: participantIds } },
        ],
      },
      select: {
        sessionId: true,
        speakerMemberId: true,
        speakerCabinetId: true,
        speakerPresidentId: true,
        chairMemberId: true,
        chairCabinetId: true,
        chairPresidentId: true,
        rating: true,
      },
    });
  }
  async function createTeamDynamicsRatings(input: {
    sessionId: string;
    raterParticipantId: MemberId;
    raterParticipantType: ParticipantType;
    teammateParticipantIds: MemberId[];
    teammateParticipantTypesById: Map<MemberId, ParticipantType>;
    rating: number;
  }) {
    if (input.teammateParticipantIds.length === 0) {
      return { count: 0 };
    }

    return client.teamDynamicsRating.createMany({
      data: input.teammateParticipantIds.map((teammateParticipantId) => {
        const teammateType = input.teammateParticipantTypesById.get(teammateParticipantId) ?? "member";
        return {
          sessionId: input.sessionId,
          raterMemberId: input.raterParticipantType === "member" ? input.raterParticipantId : null,
          raterCabinetId: input.raterParticipantType === "cabinet" ? input.raterParticipantId : null,
          raterPresidentId: input.raterParticipantType === "president" ? input.raterParticipantId : null,
          teammateMemberId: teammateType === "member" ? teammateParticipantId : null,
          teammateCabinetId: teammateType === "cabinet" ? teammateParticipantId : null,
          teammatePresidentId: teammateType === "president" ? teammateParticipantId : null,
          rating: input.rating,
        };
      }),
    });
  }

  async function getExistingTeamDynamicsRatings(sessionId: string, raterParticipantId: MemberId) {
    return client.teamDynamicsRating.findMany({
      where: {
        sessionId,
        OR: [
          { raterMemberId: raterParticipantId },
          { raterCabinetId: raterParticipantId },
          { raterPresidentId: raterParticipantId },
        ],
      },
      select: {
        teammateMemberId: true,
        teammateCabinetId: true,
        teammatePresidentId: true,
        rating: true,
      },
    });
  }

  async function getTeamDynamicsRatingsBySession(sessionId: string) {
    return client.teamDynamicsRating.findMany({
      where: { sessionId },
      select: {
        sessionId: true,
        raterMemberId: true,
        raterCabinetId: true,
        raterPresidentId: true,
        teammateMemberId: true,
        teammateCabinetId: true,
        teammatePresidentId: true,
        rating: true,
      },
    });
  }


  async function getTeamDynamicsRatingsForParticipants(participantIds: MemberId[]) {
    if (participantIds.length === 0) {
      return [];
    }

    return client.teamDynamicsRating.findMany({
      where: {
        OR: [
          { raterMemberId: { in: participantIds } },
          { raterCabinetId: { in: participantIds } },
          { raterPresidentId: { in: participantIds } },
          { teammateMemberId: { in: participantIds } },
          { teammateCabinetId: { in: participantIds } },
          { teammatePresidentId: { in: participantIds } },
        ],
      },
      select: {
        sessionId: true,
        raterMemberId: true,
        raterCabinetId: true,
        raterPresidentId: true,
        teammateMemberId: true,
        teammateCabinetId: true,
        teammatePresidentId: true,
        rating: true,
      },
    });
  }
  async function createAdjudicatorScoreRecords(input: {
    sessionId: string;
    proposalId: string;
    chairParticipantId: MemberId;
    chairParticipantType: ParticipantType;
    adjudicatorScores: Array<{
      participantId: MemberId;
      participantType: ParticipantType;
      rating: number;
      notes?: string | null;
    }>;
  }) {
    if (input.adjudicatorScores.length === 0) {
      return { count: 0 };
    }

    return client.adjudicatorScoreRecord.createMany({
      data: input.adjudicatorScores.map((score) => ({
        sessionId: input.sessionId,
        proposalId: input.proposalId,
        chairMemberId: input.chairParticipantType === "member" ? input.chairParticipantId : null,
        chairCabinetId: input.chairParticipantType === "cabinet" ? input.chairParticipantId : null,
        chairPresidentId: input.chairParticipantType === "president" ? input.chairParticipantId : null,
        adjudicatorMemberId: score.participantType === "member" ? score.participantId : null,
        adjudicatorCabinetId: score.participantType === "cabinet" ? score.participantId : null,
        adjudicatorPresidentId: score.participantType === "president" ? score.participantId : null,
        rating: score.rating,
        notes: score.notes ?? null,
      })),
    });
  }

  async function getExistingAdjudicatorScoreRecords(sessionId: string, chairParticipantId: MemberId) {
    return client.adjudicatorScoreRecord.findMany({
      where: {
        sessionId,
        OR: [
          { chairMemberId: chairParticipantId },
          { chairCabinetId: chairParticipantId },
          { chairPresidentId: chairParticipantId },
        ],
      },
      select: {
        adjudicatorMemberId: true,
        adjudicatorCabinetId: true,
        adjudicatorPresidentId: true,
        rating: true,
        notes: true,
      },
      orderBy: [{ adjudicatorMemberId: "asc" }, { adjudicatorCabinetId: "asc" }, { adjudicatorPresidentId: "asc" }],
    });
  }

  async function getAdjudicatorScoreRecordsBySession(sessionId: string) {
    return client.adjudicatorScoreRecord.findMany({
      where: { sessionId },
      select: {
        chairMemberId: true,
        chairCabinetId: true,
        chairPresidentId: true,
        adjudicatorMemberId: true,
        adjudicatorCabinetId: true,
        adjudicatorPresidentId: true,
        rating: true,
      },
    });
  }


  async function getAdjudicatorScoreRecordsForAdjudicators(participantIds: MemberId[]) {
    if (participantIds.length === 0) {
      return [];
    }

    return client.adjudicatorScoreRecord.findMany({
      where: {
        OR: [
          { adjudicatorMemberId: { in: participantIds } },
          { adjudicatorCabinetId: { in: participantIds } },
          { adjudicatorPresidentId: { in: participantIds } },
        ],
      },
      select: {
        chairMemberId: true,
        chairCabinetId: true,
        chairPresidentId: true,
        adjudicatorMemberId: true,
        adjudicatorCabinetId: true,
        adjudicatorPresidentId: true,
        rating: true,
      },
    });
  }
  function memberMetricWhere(participantId: MemberId, participantType: ParticipantType) {
    return participantType === "member"
      ? { memberId: participantId }
      : participantType === "cabinet"
        ? { cabinetId: participantId }
        : { presidentId: participantId };
  }

  function pairMetricWhere(firstId: MemberId, firstType: ParticipantType, secondId: MemberId, secondType: ParticipantType) {
    return {
      ...(firstType === "member" ? { memberAId: firstId } : firstType === "cabinet" ? { cabinetAId: firstId } : { presidentAId: firstId }),
      ...(secondType === "member" ? { memberBId: secondId } : secondType === "cabinet" ? { cabinetBId: secondId } : { presidentBId: secondId }),
    };
  }

  async function deleteMemberMetricSnapshots(input: {
    participantId: MemberId;
    participantType: ParticipantType;
    metricKeys: readonly string[];
  }) {
    return client.memberMetricSnapshot.deleteMany({
      where: {
        ...memberMetricWhere(input.participantId, input.participantType),
        metricKey: { in: [...input.metricKeys] },
      },
    });
  }

  async function deletePairMetricSnapshots(input: {
    memberAId: MemberId;
    memberAType: ParticipantType;
    memberBId: MemberId;
    memberBType: ParticipantType;
    metricKeys: readonly string[];
  }) {
    return client.pairMetricSnapshot.deleteMany({
      where: {
        ...pairMetricWhere(input.memberAId, input.memberAType, input.memberBId, input.memberBType),
        metricKey: { in: [...input.metricKeys] },
      },
    });
  }
  async function upsertMemberMetricSnapshot(input: {
    participantId: MemberId;
    participantType: ParticipantType;
    metricKey: string;
    contextKey: string | null;
    value: number;
    observationCount: number;
    confidence: number;
  }) {
    const where = memberMetricWhere(input.participantId, input.participantType);

    const existing = await client.memberMetricSnapshot.findFirst({
      where: {
        ...where,
        metricKey: input.metricKey,
        contextKey: input.contextKey,
      },
      select: { id: true },
    });

    if (existing) {
      return client.memberMetricSnapshot.update({
        where: { id: existing.id },
        data: {
          value: input.value,
          observationCount: input.observationCount,
          confidence: input.confidence,
        },
      });
    }

    return client.memberMetricSnapshot.create({
      data: {
        ...buildParticipantRef(input.participantId, input.participantType),
        metricKey: input.metricKey,
        contextKey: input.contextKey,
        value: input.value,
        observationCount: input.observationCount,
        confidence: input.confidence,
      },
    });
  }

  async function upsertPairMetricSnapshot(input: {
    memberAId: MemberId;
    memberAType: ParticipantType;
    memberBId: MemberId;
    memberBType: ParticipantType;
    metricKey: string;
    contextKey: string | null;
    value: number;
    observationCount: number;
    confidence: number;
  }) {
    const existing = await client.pairMetricSnapshot.findFirst({
      where: {
        ...pairMetricWhere(input.memberAId, input.memberAType, input.memberBId, input.memberBType),
        metricKey: input.metricKey,
        contextKey: input.contextKey,
      },
      select: { id: true },
    });

    if (existing) {
      return client.pairMetricSnapshot.update({
        where: { id: existing.id },
        data: {
          value: input.value,
          observationCount: input.observationCount,
          confidence: input.confidence,
        },
      });
    }

    return client.pairMetricSnapshot.create({
      data: {
        memberAId: input.memberAType === "member" ? input.memberAId : null,
        cabinetAId: input.memberAType === "cabinet" ? input.memberAId : null,
        presidentAId: input.memberAType === "president" ? input.memberAId : null,
        memberBId: input.memberBType === "member" ? input.memberBId : null,
        cabinetBId: input.memberBType === "cabinet" ? input.memberBId : null,
        presidentBId: input.memberBType === "president" ? input.memberBId : null,
        metricKey: input.metricKey,
        contextKey: input.contextKey,
        value: input.value,
        observationCount: input.observationCount,
        confidence: input.confidence,
      },
    });
  }

  async function getParticipantTypes(participantIds: MemberId[]) {
    const [members, cabinets, presidents] = await Promise.all([
      client.member.findMany({ where: { id: { in: participantIds } }, select: { id: true } }),
      client.cabinet.findMany({ where: { id: { in: participantIds } }, select: { id: true } }),
      client.president.findMany({ where: { id: { in: participantIds } }, select: { id: true } }),
    ]);

    const result = new Map<MemberId, ParticipantType>();
    for (const member of members) result.set(member.id, "member");
    for (const cabinet of cabinets) result.set(cabinet.id, "cabinet");
    for (const president of presidents) result.set(president.id, "president");
    return result;
  }

  async function getSpeakerLeaderboardRawData(): Promise<SpeakerLeaderboardResponse> {
    const [publishedSpeakerRows, scoreRows, legacyRows] = await Promise.all([
      client.teamSpeakerAssignment.findMany({
        where: {
          teamAssignment: {
            roomAssignment: {
              proposal: {
                publishedForSessions: {
                  some: {},
                },
              },
            },
          },
        },
        select: {
          memberId: true,
          cabinetId: true,
          presidentId: true,
          member: { select: { name: true } },
          cabinet: { select: { name: true } },
          president: { select: { name: true } },
          teamAssignment: {
            select: {
              roomAssignment: {
                select: {
                  proposal: {
                    select: {
                      publishedForSessions: {
                        select: { id: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      client.speakerScoreRecord.findMany({
        select: {
          memberId: true,
          cabinetId: true,
          presidentId: true,
          rawScore: true,
          sessionId: true,
          member: { select: { name: true } },
          cabinet: { select: { name: true } },
          president: { select: { name: true } },
        },
      }),
      client.attendance.findMany({
        where: {
          speakerScore: { not: null },
          status: { equals: "present", mode: "insensitive" },
        },
        select: {
          sessionId: true,
          memberId: true,
          cabinetId: true,
          presidentId: true,
          speakerScore: true,
          member: { select: { name: true } },
          cabinet: { select: { name: true } },
          president: { select: { name: true } },
        },
      }),
    ]);

    const aggregate = new Map<MemberId, { name: string; score: number; sessionIds: Set<string> }>();

    for (const row of publishedSpeakerRows) {
      const participantId = resolveParticipantId(row);
      const sessionId = row.teamAssignment.roomAssignment.proposal.publishedForSessions[0]?.id;
      if (!participantId || !sessionId) {
        continue;
      }

      const current = aggregate.get(participantId) ?? {
        name: row.member?.name ?? row.cabinet?.name ?? row.president?.name ?? "Unknown Participant",
        score: 0,
        sessionIds: new Set<string>(),
      };
      current.sessionIds.add(sessionId);
      aggregate.set(participantId, current);
    }

    for (const row of scoreRows) {
      const participantId = resolveParticipantId(row);
      if (!participantId) {
        continue;
      }

      const current = aggregate.get(participantId) ?? {
        name: row.member?.name ?? row.cabinet?.name ?? row.president?.name ?? "Unknown Participant",
        score: 0,
        sessionIds: new Set<string>(),
      };
      current.score += row.rawScore;
      current.sessionIds.add(row.sessionId);
      aggregate.set(participantId, current);
    }

    for (const row of legacyRows) {
      const participantId = resolveParticipantId(row);
      if (!participantId || row.speakerScore === null) {
        continue;
      }

      const current = aggregate.get(participantId) ?? {
        name: row.member?.name ?? row.cabinet?.name ?? row.president?.name ?? "Unknown Participant",
        score: 0,
        sessionIds: new Set<string>(),
      };

      if (scoreRows.length === 0) {
        current.score += row.speakerScore;
      }

      current.sessionIds.add(row.sessionId);
      aggregate.set(participantId, current);
    }

    const distinctSessionIds = new Set<string>();
    for (const entry of aggregate.values()) {
      for (const sessionId of entry.sessionIds) {
        distinctSessionIds.add(sessionId);
      }
    }

    const leaderboard = [...aggregate.entries()]
      .map(([participantId, entry]) => ({ participantId, name: entry.name, score: entry.score, sessionsCount: entry.sessionIds.size }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (right.sessionsCount !== left.sessionsCount) {
          return right.sessionsCount - left.sessionsCount;
        }
        return left.name.localeCompare(right.name);
      })
      .map((entry, index) => ({
        participantId: entry.participantId,
        name: entry.name,
        score: entry.score,
        sessionsCount: entry.sessionsCount,
        rank: index + 1,
      }));

    return { leaderboard, roundsCount: distinctSessionIds.size };
  }

  async function getAdjudicatorLeaderboardRawData(): Promise<AdjudicatorLeaderboardEntry[]> {
    const [adjudicatorRows, chairRows] = await Promise.all([
      client.adjudicatorScoreRecord.findMany({
        select: {
          adjudicatorMemberId: true,
          adjudicatorCabinetId: true,
          adjudicatorPresidentId: true,
          rating: true,
          adjudicatorMember: { select: { name: true } },
          adjudicatorCabinet: { select: { name: true } },
          adjudicatorPresident: { select: { name: true } },
        },
      }),
      client.chairFeedbackRecord.findMany({
        select: {
          sessionId: true,
          rating: true,
          chairMemberId: true,
          chairCabinetId: true,
          chairPresidentId: true,
          chairMember: { select: { name: true } },
          chairCabinet: { select: { name: true } },
          chairPresident: { select: { name: true } },
        },
      }),
    ]);

    const aggregate = new Map<MemberId, { name: string; scoreTotal: number; adjudicatedCount: number; chairedCount: number }>();
    const chairScoresByParticipantAndSession = new Map<MemberId, Map<string, { name: string; scoreTotal: number; ratingCount: number }>>();

    for (const row of adjudicatorRows) {
      const participantId = resolveParticipantId({
        memberId: row.adjudicatorMemberId,
        cabinetId: row.adjudicatorCabinetId,
        presidentId: row.adjudicatorPresidentId,
      });
      if (!participantId) {
        continue;
      }

      const current = aggregate.get(participantId) ?? {
        name: row.adjudicatorMember?.name ?? row.adjudicatorCabinet?.name ?? row.adjudicatorPresident?.name ?? "Unknown Participant",
        scoreTotal: 0,
        adjudicatedCount: 0,
        chairedCount: 0,
      };
      current.scoreTotal += row.rating;
      current.adjudicatedCount += 1;
      aggregate.set(participantId, current);
    }

    for (const row of chairRows) {
      const participantId = resolveParticipantId({
        memberId: row.chairMemberId,
        cabinetId: row.chairCabinetId,
        presidentId: row.chairPresidentId,
      });
      if (!participantId) {
        continue;
      }

      const sessions = chairScoresByParticipantAndSession.get(participantId) ?? new Map<string, { name: string; scoreTotal: number; ratingCount: number }>();
      const currentSession = sessions.get(row.sessionId) ?? {
        name: row.chairMember?.name ?? row.chairCabinet?.name ?? row.chairPresident?.name ?? "Unknown Participant",
        scoreTotal: 0,
        ratingCount: 0,
      };
      currentSession.scoreTotal += row.rating;
      currentSession.ratingCount += 1;
      sessions.set(row.sessionId, currentSession);
      chairScoresByParticipantAndSession.set(participantId, sessions);
    }

    for (const [participantId, sessions] of chairScoresByParticipantAndSession.entries()) {
      const current = aggregate.get(participantId) ?? {
        name: [...sessions.values()][0]?.name ?? "Unknown Participant",
        scoreTotal: 0,
        adjudicatedCount: 0,
        chairedCount: 0,
      };

      for (const sessionScore of sessions.values()) {
        current.scoreTotal += sessionScore.ratingCount === 0 ? 0 : sessionScore.scoreTotal / sessionScore.ratingCount;
        current.chairedCount += 1;
      }

      aggregate.set(participantId, current);
    }

    return [...aggregate.entries()]
      .map(([participantId, entry]) => {
        const combinedCount = entry.adjudicatedCount + entry.chairedCount;
        return {
          participantId,
          name: entry.name,
          score: combinedCount === 0 ? 0 : entry.scoreTotal / combinedCount,
          sessionsCount: combinedCount,
          adjudicatedCount: entry.adjudicatedCount,
          chairedCount: entry.chairedCount,
        };
      })
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }
  async function getParticipantProgressProfile(participantId: MemberId): Promise<ParticipantProgressProfile> {
    const [rawMetrics, attendanceRows, pairMetrics, assignmentCounts] = await Promise.all([
      client.memberMetricSnapshot.findMany({
        where: {
          OR: [{ memberId: participantId }, { cabinetId: participantId }, { presidentId: participantId }],
        },
        select: {
          metricKey: true,
          contextKey: true,
          value: true,
          observationCount: true,
          confidence: true,
        },
        orderBy: [{ metricKey: "asc" }, { contextKey: "asc" }],
      }),
      client.attendance.findMany({
        where: {
          OR: [{ memberId: participantId }, { cabinetId: participantId }, { presidentId: participantId }],
        },
        select: {
          status: true,
          sessionId: true,
        },
      }),
      client.pairMetricSnapshot.findMany({
        where: {
          OR: [
            { memberAId: participantId },
            { cabinetAId: participantId },
            { presidentAId: participantId },
            { memberBId: participantId },
            { cabinetBId: participantId },
            { presidentBId: participantId },
          ],
        },
        select: {
          memberAId: true,
          cabinetAId: true,
          presidentAId: true,
          memberBId: true,
          cabinetBId: true,
          presidentBId: true,
          metricKey: true,
          contextKey: true,
          value: true,
          observationCount: true,
          confidence: true,
        },
      }),
      getRoleAssignmentCounts(participantId),
    ]);

    const summary = buildProgressSummaryFromMetrics(
      participantId,
      rawMetrics.map((metric: { metricKey: string; value: number; confidence: number; observationCount: number }) => ({
        metricKey: metric.metricKey,
        value: metric.value,
        confidence: metric.confidence,
        observationCount: metric.observationCount,
      })),
      assignmentCounts,
    );

    const presentCount = attendanceRows.filter((row: { status: string }) => row.status.toLowerCase() === "present").length;
    const totalCount = attendanceRows.length;
    const attendancePercentage = totalCount === 0 ? 0 : Number(((presentCount / totalCount) * 100).toFixed(1));

    const motionTypeScores: ParticipantMotionTypeScore[] = rawMetrics
      .filter((metric: { metricKey: string; contextKey: string | null }) => metric.metricKey === "speaker_motion_type_score" && metric.contextKey)
      .map((metric: { contextKey: string | null; value: number; observationCount: number; confidence: number }) => ({
        motionType: metric.contextKey ?? "Unknown",
        score: metric.value,
        observationCount: metric.observationCount,
        confidence: metric.confidence,
      }))
      .sort((left: { score: number }, right: { score: number }) => right.score - left.score);

    const roleScores: ParticipantRoleScore[] = rawMetrics
      .filter((metric: { metricKey: string; contextKey: string | null }) => metric.metricKey === "role_score" && metric.contextKey)
      .map((metric: { contextKey: string | null; value: number; observationCount: number; confidence: number }) => ({
        role: metric.contextKey ?? "Unknown",
        score: metric.value,
        observationCount: metric.observationCount,
        confidence: metric.confidence,
      }))
      .sort((left: { score: number }, right: { score: number }) => right.score - left.score);

    const partnerIds = new Set<MemberId>();
    for (const metric of pairMetrics) {
      const firstId = resolveParticipantId({
        memberId: metric.memberAId,
        cabinetId: metric.cabinetAId,
        presidentId: metric.presidentAId,
      });
      const secondId = resolveParticipantId({
        memberId: metric.memberBId,
        cabinetId: metric.cabinetBId,
        presidentId: metric.presidentBId,
      });
      const partnerId = firstId === participantId ? secondId : secondId === participantId ? firstId : "";
      if (partnerId) {
        partnerIds.add(partnerId);
      }
    }

    const [partnerMembers, partnerCabinets, partnerPresidents] = partnerIds.size === 0
      ? [[], [], []]
      : await Promise.all([
          client.member.findMany({ where: { id: { in: [...partnerIds] } }, select: { id: true, name: true } }),
          client.cabinet.findMany({ where: { id: { in: [...partnerIds] } }, select: { id: true, name: true } }),
          client.president.findMany({ where: { id: { in: [...partnerIds] } }, select: { id: true, name: true } }),
        ]);

    const partnerNames = new Map<MemberId, string>();
    for (const partner of partnerMembers) partnerNames.set(partner.id, partner.name);
    for (const partner of partnerCabinets) partnerNames.set(partner.id, partner.name);
    for (const partner of partnerPresidents) partnerNames.set(partner.id, partner.name);

    const compatibilityProfiles: ParticipantCompatibilityProfile[] = pairMetrics
      .filter((metric: { metricKey: string }) => metric.metricKey === "partner_dynamics_overall")
      .map((metric: {
        memberAId: string | null;
        cabinetAId: string | null;
        presidentAId: string | null;
        memberBId: string | null;
        cabinetBId: string | null;
        presidentBId: string | null;
        value: number;
        observationCount: number;
        confidence: number;
      }) => {
        const firstId = resolveParticipantId({
          memberId: metric.memberAId,
          cabinetId: metric.cabinetAId,
          presidentId: metric.presidentAId,
        });
        const secondId = resolveParticipantId({
          memberId: metric.memberBId,
          cabinetId: metric.cabinetBId,
          presidentId: metric.presidentBId,
        });
        const partnerId = firstId === participantId ? secondId : secondId === participantId ? firstId : "";
        if (!partnerId) {
          return null;
        }

        return {
          participantId: partnerId,
          name: partnerNames.get(partnerId) ?? "Unknown Participant",
          score: metric.value,
          observationCount: metric.observationCount,
          confidence: metric.confidence,
        } satisfies ParticipantCompatibilityProfile;
      })
      .filter((profile: ParticipantCompatibilityProfile | null): profile is ParticipantCompatibilityProfile => profile !== null)
      .sort((left: ParticipantCompatibilityProfile, right: ParticipantCompatibilityProfile) => right.score - left.score)
      .slice(0, 5);

    const strongestMotion = motionTypeScores[0];
    const weakestMotion = motionTypeScores.at(-1);
    const bestRole = roleScores[0];
    const weakestRole = roleScores.at(-1);
    const lowConfidenceMotions = motionTypeScores.filter((metric) => metric.observationCount < 2 || metric.confidence < 0.4);
    const bestPartner = compatibilityProfiles[0];
    const weakestPartner = compatibilityProfiles.at(-1);

    const verdict = {
      strengths: [
        ...(strongestMotion ? [`Strongest motion type: ${strongestMotion.motionType}`] : []),
        ...(summary.speakerStrength > 0 ? [`Speaker strength is ${summary.speakerStrength.toFixed(2)}`] : []),
      ],
      weaknesses: [
        ...(weakestMotion && motionTypeScores.length > 1 ? [`Needs improvement in ${weakestMotion.motionType}`] : []),
        ...(weakestRole && roleScores.length > 1 ? [`Lowest current role fit: ${weakestRole.role}`] : []),
      ],
      gaps: [
        ...(attendanceRows.length > 0 ? [`Attendance: ${attendancePercentage}% across ${totalCount} tracked sessions`] : ["No attendance history yet"]),
        ...lowConfidenceMotions.map((metric) => `Needs more data for ${metric.motionType}`),
      ],
      roleAptitude: [
        ...(bestRole ? [`Best current role fit: ${bestRole.role}`] : []),
        ...(roleScores.length === 0 ? ["Role-specific progress has not been established yet"] : []),
      ],
      compatibility: [
        ...(bestPartner ? [`Pairs well with ${bestPartner.name}`] : []),
        ...(weakestPartner && compatibilityProfiles.length > 1 ? [`Watch pairing friction with ${weakestPartner.name}`] : []),
      ],
    };

    return {
      participantId,
      attendance: {
        presentCount,
        totalCount,
        attendancePercentage,
      },
      summary,
      motionTypeScores,
      roleScores,
      compatibilityProfiles,
      rawMetrics: rawMetrics.map((metric: {
        metricKey: string;
        contextKey: string | null;
        value: number;
        observationCount: number;
        confidence: number;
      }) => ({
        metricKey: metric.metricKey,
        contextKey: metric.contextKey,
        value: metric.value,
        observationCount: metric.observationCount,
        confidence: metric.confidence,
      })) satisfies ParticipantMetricDetail[],
      verdict,
    };
  }

  async function getAllParticipantProgressSummaries(): Promise<ParticipantProgressSummary[]> {
    const [members, cabinets, presidents] = await Promise.all([
      client.member.findMany({ select: { id: true } }),
      client.cabinet.findMany({ select: { id: true } }),
      client.president.findMany({ select: { id: true } }),
    ]);

    const participantIds = [...members, ...cabinets, ...presidents].map((participant) => participant.id);
    const summaries = await Promise.all(participantIds.map((participantId) => getParticipantProgressSummary(participantId)));
    return summaries.sort((left, right) => right.speakerStrength - left.speakerStrength);
  }

  async function getParticipantProgressSummary(participantId: MemberId): Promise<ParticipantProgressSummary> {
    const [metrics, assignmentCounts] = await Promise.all([
      loadProgressSummaryMetrics(participantId),
      getRoleAssignmentCounts(participantId),
    ]);
    return buildProgressSummaryFromMetrics(participantId, metrics, assignmentCounts);
  }

  return {
    getPublishedScoringContext,
    getPublishedScoringParticipantIds,
    createSpeakerScoreRecords,
    getExistingSpeakerScoreRecords,
    getSpeakerScoreRecordsBySession,
    getSpeakerScoreRecordsForParticipants,
    getSparSpeakerScoresForParticipants,
    getSparRecordForMetricUpdate,
    getSparRecordsByTeammate,
    createChairFeedbackRecord,
    getChairFeedbackBySpeaker,
    getChairFeedbackBySession,
    getChairFeedbackForChairs,
    createTeamDynamicsRatings,
    getExistingTeamDynamicsRatings,
    getTeamDynamicsRatingsBySession,
    getTeamDynamicsRatingsForParticipants,
    createAdjudicatorScoreRecords,
    getExistingAdjudicatorScoreRecords,
    getAdjudicatorScoreRecordsBySession,
    getAdjudicatorScoreRecordsForAdjudicators,
    deleteMemberMetricSnapshots,
    deletePairMetricSnapshots,
    upsertMemberMetricSnapshot,
    upsertPairMetricSnapshot,
    getParticipantTypes,
    getSpeakerLeaderboardRawData,
    getAdjudicatorLeaderboardRawData,
    getAllParticipantProgressSummaries,
    getParticipantProgressProfile,
    getParticipantProgressSummary,
  };
}

export const scoringRepository = createScoringRepository();






