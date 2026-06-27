import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type {
  AdjudicatorMetricSnapshot,
  MemberId,
  MotionTypeSummary,
  PairingGenerationContext,
  PairingProposalSummary,
  PairingProposalView,
  PairingRoomView,
  ParticipantContext,
  ParticipantKind,
  PublishPairingRequest,
  PublishedPairingView,
  ReviewAction,
  RoleHistorySummary,
  UnassignedParticipantView,
} from "../../../types/pairing.ts";
import type { SessionRole } from "../../../types/session.ts";
import { createMetricsRepository, resolveParticipantId } from "./metrics-repository.ts";

type PairingRepositoryClient = PrismaClient;
type TransactionClient = Prisma.TransactionClient;

type SessionRoleAssignmentProjection = {
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
  role: string;
  isChair: boolean;
};

type ParticipantProjection = {
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
  member: { id: string; name: string } | null;
  cabinet: { id: string; name: string } | null;
  president: { id: string; name: string } | null;
};

interface RoomAssignmentSummary {
  proposalId: string;
  rooms: PairingRoomView[];
  unassignedParticipants: UnassignedParticipantView[];
}

function participantKindFromProjection(participant: ParticipantProjection): ParticipantKind {
  if (participant.memberId) return "member";
  if (participant.cabinetId) return "cabinet";
  return "president";
}

function participantNameFromProjection(participant: ParticipantProjection): string {
  return participant.member?.name ?? participant.cabinet?.name ?? participant.president?.name ?? "Unknown Participant";
}

function participantIdFromProjection(participant: ParticipantProjection): MemberId {
  return resolveParticipantId(participant);
}

function toSessionRole(role: string): SessionRole {
  return role === "adjudicator" ? "adjudicator" : "speaker";
}

function parseScoreBreakdown(scoreBreakdownJson: unknown) {
  const breakdown = (scoreBreakdownJson ?? {}) as Partial<Record<string, number>>;

  return {
    roomBalanceScore: breakdown.roomBalanceScore ?? 0,
    adjudicatorAverageScore: breakdown.adjudicatorAverageScore ?? 0,
    chairScore: breakdown.chairScore ?? 0,
    teamQualityAggregate: breakdown.teamQualityAggregate ?? 0,
    experienceDistributionAggregate: breakdown.experienceDistributionAggregate ?? 0,
    totalProposalScore: breakdown.totalProposalScore ?? 0,
  };
}

function toIsoString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function buildProposalSummary(proposal: {
  id: string;
  sessionId: string;
  proposalVersion: number;
  status: string;
  engineVersion: string;
  ruleVersion: string;
  topBandRank: number | null;
  proposalScore: number;
  scoreBreakdownJson: unknown;
  generatedAt: Date;
  generatedBy: string | null;
  approvedAt: Date | null;
  publishedAt: Date | null;
  isPublishedOfficially: boolean;
}): PairingProposalSummary {
  return {
    proposalId: proposal.id,
    sessionId: proposal.sessionId,
    version: proposal.proposalVersion,
    status: proposal.status as PairingProposalSummary["status"],
    engineVersion: proposal.engineVersion,
    ruleVersion: proposal.ruleVersion,
    topBandRank: proposal.topBandRank,
    proposalScore: proposal.proposalScore,
    scoreBreakdown: parseScoreBreakdown(proposal.scoreBreakdownJson),
    generatedAt: proposal.generatedAt.toISOString(),
    generatedBy: proposal.generatedBy,
    approvedAt: toIsoString(proposal.approvedAt),
    publishedAt: toIsoString(proposal.publishedAt),
    isPublishedOfficially: proposal.isPublishedOfficially,
  };
}

function buildAdjudicatorMetricMap(
  participantIds: MemberId[],
  metricSnapshots: Awaited<ReturnType<ReturnType<typeof createMetricsRepository>["getMemberMetricSnapshots"]>>,
): Map<MemberId, AdjudicatorMetricSnapshot> {
  const grouped = new Map<MemberId, Map<string, (typeof metricSnapshots)[number]>>();

  for (const snapshot of metricSnapshots) {
    if (!grouped.has(snapshot.participantId)) {
      grouped.set(snapshot.participantId, new Map());
    }
    grouped.get(snapshot.participantId)!.set(snapshot.metricKey, snapshot);
  }

  return new Map(
    participantIds.map((participantId) => {
      const metrics = grouped.get(participantId);
      return [
        participantId,
        {
          participantId,
          adjudicatorAverageScore: metrics?.get("adjudicator_average_score")?.value ?? 0,
          chairScore: metrics?.get("chair_score")?.value ?? 0,
          confidence: Math.max(
            metrics?.get("adjudicator_average_score")?.confidence ?? 0,
            metrics?.get("chair_score")?.confidence ?? 0,
          ),
        } satisfies AdjudicatorMetricSnapshot,
      ];
    }),
  );
}

function buildRoleHistoryMap(
  rows: Array<{
    memberId: string | null;
    cabinetId: string | null;
    presidentId: string | null;
    speakingRole: string;
  }>,
): Map<MemberId, RoleHistorySummary> {
  const grouped = new Map<MemberId, RoleHistorySummary>();

  for (const row of rows) {
    const participantId = resolveParticipantId(row);
    if (!participantId) {
      continue;
    }

    const current = grouped.get(participantId) ?? { participantId, roleCounts: {} };
    current.roleCounts[row.speakingRole as keyof typeof current.roleCounts] =
      (current.roleCounts[row.speakingRole as keyof typeof current.roleCounts] ?? 0) + 1;
    grouped.set(participantId, current);
  }

  return grouped;
}

function buildMotionTypeHistoryMap(
  rows: Array<{
    memberId: string | null;
    cabinetId: string | null;
    presidentId: string | null;
    session: { motionType: string | null; motiontype: string };
  }>,
): Map<MemberId, MotionTypeSummary> {
  const grouped = new Map<MemberId, MotionTypeSummary>();

  for (const row of rows) {
    const participantId = resolveParticipantId(row);
    const motionType = row.session.motionType ?? row.session.motiontype;
    if (!participantId || !motionType) {
      continue;
    }

    const current = grouped.get(participantId) ?? { participantId, motionTypeCounts: {} };
    current.motionTypeCounts[motionType] = (current.motionTypeCounts[motionType] ?? 0) + 1;
    grouped.set(participantId, current);
  }

  return grouped;
}

function buildRoomViews(
  proposal: {
    roomAssignments: Array<{
      roomIndex: number;
      roomScore: number | null;
      roomBalanceScore: number | null;
      roomDifficultyScore: number | null;
      teamAssignments: Array<{
        bpPosition: string;
        teamScore: number | null;
        speakerAssignments: Array<ParticipantProjection & { speakingRole: string }>;
      }>;
      adjudicatorAssignments: Array<ParticipantProjection & { isChair: boolean; chairAssignmentScore: number | null }>;
    }>;
  },
): PairingRoomView[] {
  return proposal.roomAssignments
    .slice()
    .sort((left, right) => left.roomIndex - right.roomIndex)
    .map((room) => ({
      roomIndex: room.roomIndex,
      roomScore: room.roomScore,
      roomBalanceScore: room.roomBalanceScore,
      roomDifficultyScore: room.roomDifficultyScore,
      teams: room.teamAssignments.map((team) => ({
        bpPosition: team.bpPosition as PairingRoomView["teams"][number]["bpPosition"],
        teamScore: team.teamScore,
        speakers: team.speakerAssignments.map((speaker) => ({
          participantId: participantIdFromProjection(speaker),
          speakingRole: speaker.speakingRole as PairingRoomView["teams"][number]["speakers"][number]["speakingRole"],
        })),
      })),
      adjudicators: room.adjudicatorAssignments.map((adjudicator) => ({
        participantId: participantIdFromProjection(adjudicator),
        isChair: adjudicator.isChair,
        chairAssignmentScore: adjudicator.chairAssignmentScore,
      })),
    }));
}

function buildUnassignedParticipants(
  participants: Array<ParticipantProjection & { reason: string }>,
): UnassignedParticipantView[] {
  return participants.map((participant) => ({
    participantId: participantIdFromProjection(participant),
    reason: participant.reason as UnassignedParticipantView["reason"],
  }));
}

async function loadProposalForView(client: PairingRepositoryClient | TransactionClient, proposalId: string) {
  return client.pairingProposal.findUnique({
    where: { id: proposalId },
    select: {
      id: true,
      sessionId: true,
      proposalVersion: true,
      status: true,
      engineVersion: true,
      ruleVersion: true,
      topBandRank: true,
      proposalScore: true,
      scoreBreakdownJson: true,
      generatedAt: true,
      generatedBy: true,
      approvedAt: true,
      publishedAt: true,
      isPublishedOfficially: true,
      roomAssignments: {
        select: {
          roomIndex: true,
          roomScore: true,
          roomBalanceScore: true,
          roomDifficultyScore: true,
          teamAssignments: {
            select: {
              bpPosition: true,
              teamScore: true,
              speakerAssignments: {
                select: {
                  memberId: true,
                  cabinetId: true,
                  presidentId: true,
                  member: { select: { id: true, name: true } },
                  cabinet: { select: { id: true, name: true } },
                  president: { select: { id: true, name: true } },
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
              member: { select: { id: true, name: true } },
              cabinet: { select: { id: true, name: true } },
              president: { select: { id: true, name: true } },
              isChair: true,
              chairAssignmentScore: true,
            },
            orderBy: [{ isChair: "desc" }, { memberId: "asc" }],
          },
        },
        orderBy: { roomIndex: "asc" },
      },
      unassignedParticipants: {
        select: {
          memberId: true,
          cabinetId: true,
          presidentId: true,
          member: { select: { id: true, name: true } },
          cabinet: { select: { id: true, name: true } },
          president: { select: { id: true, name: true } },
          reason: true,
        },
      },
      reviewLogs: {
        select: {
          action: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export function createPairingRepository(client: PairingRepositoryClient = prisma) {
  const metricsRepository = createMetricsRepository(client);

  async function getGenerationContext(sessionId: string): Promise<PairingGenerationContext> {
    const sessionRecord = await client.debateSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        motionType: true,
        motiontype: true,
        motionText: true,
        pairingObjective: true,
        attendance: {
          where: { isPresent: true },
          select: {
            memberId: true,
            cabinetId: true,
            presidentId: true,
            member: { select: { id: true, name: true } },
            cabinet: { select: { id: true, name: true } },
            president: { select: { id: true, name: true } },
          },
        },
        sessionRoleAssignments: {
          select: {
            memberId: true,
            cabinetId: true,
            presidentId: true,
            role: true,
            isChair: true,
          },
        },
      },
    });

    if (!sessionRecord) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    const roleAssignmentsByParticipantId = new Map<MemberId, SessionRoleAssignmentProjection>(
      sessionRecord.sessionRoleAssignments.map((assignment: SessionRoleAssignmentProjection) => [
        resolveParticipantId(assignment),
        assignment,
      ]),
    );

    const participants = sessionRecord.attendance
      .map((participant: ParticipantProjection) => {
        const participantId = participantIdFromProjection(participant);
        if (!participantId) {
          return null;
        }

        const roleAssignment = roleAssignmentsByParticipantId.get(participantId);

        return {
          participantId,
          participantKind: participantKindFromProjection(participant),
          name: participantNameFromProjection(participant),
          academicYear: null,
          sessionRole: toSessionRole(roleAssignment?.role ?? "speaker"),
          isChairEligible: roleAssignment?.role === "adjudicator",
        } satisfies ParticipantContext;
      })
      .filter((participant: ParticipantContext | null): participant is ParticipantContext => participant !== null);

    const participantIds = participants.map((participant: ParticipantContext) => participant.participantId);
    const pairMetricKeys = participantIds.flatMap((firstParticipantId: MemberId, index: number) =>
      participantIds
        .slice(index + 1)
        .map((secondParticipantId: MemberId) => [firstParticipantId, secondParticipantId].sort().join("::")),
    );

    const [memberMetricSnapshots, pairMetricSnapshots, roleHistoryRows, motionTypeHistoryRows] =
      await Promise.all([
        metricsRepository.getMemberMetricSnapshots(participantIds),
        metricsRepository.getPairMetricSnapshots(pairMetricKeys),
        client.speakerScoreRecord.findMany({
          where: {
            OR: [
              { memberId: { in: participantIds } },
              { cabinetId: { in: participantIds } },
              { presidentId: { in: participantIds } },
            ],
          },
          select: {
            memberId: true,
            cabinetId: true,
            presidentId: true,
            speakingRole: true,
          },
        }),
        client.speakerScoreRecord.findMany({
          where: {
            OR: [
              { memberId: { in: participantIds } },
              { cabinetId: { in: participantIds } },
              { presidentId: { in: participantIds } },
            ],
          },
          select: {
            memberId: true,
            cabinetId: true,
            presidentId: true,
            session: {
              select: {
                motionType: true,
                motiontype: true,
              },
            },
          },
        }),
      ]);

    const preferredMetricByParticipant = new Map<MemberId, (typeof memberMetricSnapshots)[number]>();
    for (const snapshot of memberMetricSnapshots) {
      const current = preferredMetricByParticipant.get(snapshot.participantId);
      const currentPriority = current?.metricKey === "speaker_strength" ? 2 : current ? 1 : 0;
      const nextPriority = snapshot.metricKey === "speaker_strength" ? 2 : 1;
      if (!current || nextPriority > currentPriority) {
        preferredMetricByParticipant.set(snapshot.participantId, snapshot);
      }
    }

    return {
      session: {
        sessionId: sessionRecord.id,
        motionType: sessionRecord.motionType ?? sessionRecord.motiontype,
        motionText: sessionRecord.motionText ?? "",
        pairingObjective: (sessionRecord.pairingObjective ?? "BALANCED") as PairingGenerationContext["session"]["pairingObjective"],
      },
      participants,
      memberMetricsById: preferredMetricByParticipant,
      pairMetricsByKey: new Map(pairMetricSnapshots.map((snapshot: (typeof pairMetricSnapshots)[number]) => [snapshot.pairKey, snapshot])),
      roleHistoryByMemberId: buildRoleHistoryMap(roleHistoryRows),
      motionTypeHistoryByMemberId: buildMotionTypeHistoryMap(motionTypeHistoryRows),
      adjudicatorMetricsById: buildAdjudicatorMetricMap(participantIds, memberMetricSnapshots),
      rules: {
        timeConstraintParticipantIds: [],
        forcedTeamUps: [],
        forcedSeparations: [],
        forcedChairParticipantId: null,
        forcedRoomCount: null,
      },
    };
  }

  async function getPairingProposalView(proposalId: string): Promise<PairingProposalView | null> {
    const proposal = await loadProposalForView(client, proposalId);
    if (!proposal) {
      return null;
    }

    return {
      summary: buildProposalSummary(proposal),
      rooms: buildRoomViews(proposal),
      unassignedParticipants: buildUnassignedParticipants(proposal.unassignedParticipants),
      reviewState: {
        isApproved: proposal.status === "APPROVED",
        isPublished: proposal.isPublishedOfficially,
        lastAction: (proposal.reviewLogs[0]?.action ?? null) as ReviewAction | null,
      },
    };
  }

  async function getRoomAssignmentSummary(sessionId: string): Promise<RoomAssignmentSummary | null> {
    const sessionRecord = await client.debateSession.findUnique({
      where: { id: sessionId },
      select: {
        publishedProposalId: true,
        acceptedProposalId: true,
      },
    });

    const proposalId = sessionRecord?.publishedProposalId ?? sessionRecord?.acceptedProposalId;
    if (!proposalId) {
      return null;
    }

    const proposal = await loadProposalForView(client, proposalId);
    if (!proposal) {
      return null;
    }

    return {
      proposalId: proposal.id,
      rooms: buildRoomViews(proposal),
      unassignedParticipants: buildUnassignedParticipants(proposal.unassignedParticipants),
    };
  }

  async function getPublishedPairing(sessionId: string): Promise<PublishedPairingView | null> {
    const sessionRecord = await client.debateSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        motionType: true,
        motiontype: true,
        motionText: true,
        publishedAt: true,
        publishedProposalId: true,
      },
    });

    if (!sessionRecord?.publishedProposalId || !sessionRecord.publishedAt) {
      return null;
    }

    const roomAssignmentSummary = await getRoomAssignmentSummary(sessionId);
    if (!roomAssignmentSummary) {
      return null;
    }

    return {
      sessionId: sessionRecord.id,
      proposalId: roomAssignmentSummary.proposalId,
      publishedAt: sessionRecord.publishedAt.toISOString(),
      motionType: sessionRecord.motionType ?? sessionRecord.motiontype,
      motionText: sessionRecord.motionText ?? "",
      rooms: roomAssignmentSummary.rooms,
      unassignedParticipants: roomAssignmentSummary.unassignedParticipants,
    };
  }

  async function publishProposalTransaction(input: PublishPairingRequest): Promise<PublishedPairingView> {
    return client.$transaction(async (tx: TransactionClient) => {
      const approvedProposal = await tx.pairingProposal.findFirst({
        where: {
          sessionId: input.sessionId,
          status: "APPROVED",
        },
        orderBy: [{ approvedAt: "desc" }, { proposalVersion: "desc" }],
        select: {
          id: true,
        },
      });

      if (!approvedProposal) {
        throw new Error(`No approved proposal found for session ${input.sessionId}.`);
      }

      const publishedAt = new Date();

      await tx.pairingProposal.update({
        where: { id: approvedProposal.id },
        data: {
          status: "PUBLISHED",
          publishedAt,
          isPublishedOfficially: true,
        },
      });

      await tx.debateSession.update({
        where: { id: input.sessionId },
        data: {
          publishedProposalId: approvedProposal.id,
          publishedAt,
          publicationStatus: "PUBLISHED",
          pairingStatus: "PUBLISHED",
          acceptedProposalId: approvedProposal.id,
        },
      });

      await tx.attendance.updateMany({
        where: { sessionId: input.sessionId },
        data: {
          isFinalized: true,
        },
      });

      const txBackedRepository = createPairingRepository(tx as unknown as PairingRepositoryClient);
      const publishedPairing = await txBackedRepository.getPublishedPairing(input.sessionId);

      if (!publishedPairing) {
        throw new Error(`Published pairing could not be materialized for session ${input.sessionId}.`);
      }

      return publishedPairing;
    });
  }

  return {
    getGenerationContext,
    getPairingProposalView,
    getRoomAssignmentSummary,
    getPublishedPairing,
    publishProposalTransaction,
  };
}

export const pairingRepository = createPairingRepository();