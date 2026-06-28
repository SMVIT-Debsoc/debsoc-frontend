import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type {
  AdjudicatorLeaderboardEntry,
  LeaderboardEntry,
  ParticipantProgressProfile,
  ParticipantProgressSummary,
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
        session.publishedProposal?.roomAssignments.map((room: { roomIndex: number; teamAssignments: Array<{ bpPosition: string; speakerAssignments: Array<{ memberId: string | null; cabinetId: string | null; presidentId: string | null; speakingRole: string }> }>; adjudicatorAssignments: Array<{ memberId: string | null; cabinetId: string | null; presidentId: string | null; isChair: boolean }> }) => ({
          roomIndex: room.roomIndex,
          speakers: room.teamAssignments.flatMap((team: { bpPosition: string; speakerAssignments: Array<{ memberId: string | null; cabinetId: string | null; presidentId: string | null; speakingRole: string }> }) =>
            team.speakerAssignments.map((speaker: { memberId: string | null; cabinetId: string | null; presidentId: string | null; speakingRole: string }) => ({
              participantId: resolveParticipantId(speaker),
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

  async function createSpeakerScoreRecords(
    sessionId: string,
    proposalId: string,
    records: Array<{
      participantId: MemberId;
      participantType: ParticipantType;
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
        memberId: true,
        cabinetId: true,
        presidentId: true,
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

  async function upsertMemberMetricSnapshot(input: {
    participantId: MemberId;
    participantType: ParticipantType;
    metricKey: string;
    contextKey: string | null;
    value: number;
    observationCount: number;
    confidence: number;
  }) {
    const where = input.participantType === "member"
      ? { memberId: input.participantId }
      : input.participantType === "cabinet"
        ? { cabinetId: input.participantId }
        : { presidentId: input.participantId };

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
        ...(input.memberAType === "member" ? { memberAId: input.memberAId } : input.memberAType === "cabinet" ? { cabinetAId: input.memberAId } : { presidentAId: input.memberAId }),
        ...(input.memberBType === "member" ? { memberBId: input.memberBId } : input.memberBType === "cabinet" ? { cabinetBId: input.memberBId } : { presidentBId: input.memberBId }),
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

  async function getSpeakerLeaderboardRawData(): Promise<LeaderboardEntry[]> {
    const rows = await client.speakerScoreRecord.findMany({
      select: {
        memberId: true,
        cabinetId: true,
        presidentId: true,
        rawScore: true,
        member: { select: { name: true } },
        cabinet: { select: { name: true } },
        president: { select: { name: true } },
      },
    });

    const aggregate = new Map<MemberId, { name: string; score: number; sessionsCount: number }>();

    for (const row of rows) {
      const participantId = resolveParticipantId(row);
      if (!participantId) {
        continue;
      }

      const current = aggregate.get(participantId) ?? {
        name: row.member?.name ?? row.cabinet?.name ?? row.president?.name ?? "Unknown Participant",
        score: 0,
        sessionsCount: 0,
      };
      current.score += row.rawScore;
      current.sessionsCount += 1;
      aggregate.set(participantId, current);
    }

    return [...aggregate.entries()]
      .map(([participantId, entry]) => ({ participantId, ...entry }))
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => ({
        participantId: entry.participantId,
        name: entry.name,
        score: entry.score,
        sessionsCount: entry.sessionsCount,
        rank: index + 1,
      }));
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
          chairMemberId: true,
          chairCabinetId: true,
          chairPresidentId: true,
        },
      }),
    ]);

    const aggregate = new Map<MemberId, { name: string; scoreTotal: number; adjudicatedCount: number; chairedCount: number }>();

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

      const current = aggregate.get(participantId) ?? {
        name: "Unknown Participant",
        scoreTotal: 0,
        adjudicatedCount: 0,
        chairedCount: 0,
      };
      current.chairedCount += 1;
      aggregate.set(participantId, current);
    }

    return [...aggregate.entries()]
      .map(([participantId, entry]) => ({
        participantId,
        name: entry.name,
        score: entry.adjudicatedCount === 0 ? 0 : entry.scoreTotal / entry.adjudicatedCount,
        sessionsCount: entry.adjudicatedCount,
        adjudicatedCount: entry.adjudicatedCount,
        chairedCount: entry.chairedCount,
      }))
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }

  async function getParticipantProgressProfile(participantId: MemberId): Promise<ParticipantProgressProfile> {
    const rawMetrics = await client.memberMetricSnapshot.findMany({
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
    });

    return {
      participantId,
      rawMetrics,
      verdict: {
        strengths: [],
        weaknesses: [],
        gaps: [],
        roleAptitude: [],
        compatibility: [],
      },
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
    const metrics: Array<{ metricKey: string; value: number; confidence: number; observationCount: number }> = await client.memberMetricSnapshot.findMany({
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

    const byMetric = new Map(metrics.map((metric: (typeof metrics)[number]) => [metric.metricKey, metric]));
    const speakerStrengthConfidence = byMetric.get("speaker_strength")?.confidence ?? 0;

    return {
      participantId,
      speakerTotalScore: byMetric.get("speaker_total_score")?.value ?? 0,
      speakerStrength: byMetric.get("speaker_strength")?.value ?? 0,
      confidence: speakerStrengthConfidence,
      sessionsSpoken: byMetric.get("speaker_total_score")?.observationCount ?? 0,
      sessionsAdjudicated: byMetric.get("adjudicator_average_score")?.observationCount ?? 0,
      sessionsChaired: byMetric.get("chair_score")?.observationCount ?? 0,
      dataMaturity: speakerStrengthConfidence >= 0.8 ? "HIGH" : speakerStrengthConfidence >= 0.4 ? "MEDIUM" : "LOW",
    };
  }

  return {
    getPublishedScoringContext,
    createSpeakerScoreRecords,
    getExistingSpeakerScoreRecords,
    getSpeakerScoreRecordsBySession,
    createChairFeedbackRecord,
    getChairFeedbackBySpeaker,
    getChairFeedbackBySession,
    createTeamDynamicsRatings,
    getExistingTeamDynamicsRatings,
    getTeamDynamicsRatingsBySession,
    createAdjudicatorScoreRecords,
    getExistingAdjudicatorScoreRecords,
    getAdjudicatorScoreRecordsBySession,
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



