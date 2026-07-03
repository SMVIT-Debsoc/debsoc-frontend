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
  TeamUpRule,
  TimeConstraintRule,
  UnassignedParticipantView,
} from "../../../types/pairing.ts";
import type { SessionRole } from "../../../types/session.ts";
import type { PersistGeneratedProposalInput } from "../pairing/types.ts";
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

interface ManualAssignmentPayload {
  rooms: Array<{
    roomIndex: number;
    teams: Array<{
      bpPosition: string;
      speakers: Array<{ participantId: string; speakingRole: string }>;
    }>;
    adjudicators: Array<{ participantId: string; isChair: boolean }>;
  }>;
  assignedParticipantIds?: string[];
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

function buildParticipantReferenceData(participantId: MemberId, participantKind: ParticipantKind) {
  return {
    memberId: participantKind === "member" ? participantId : null,
    cabinetId: participantKind === "cabinet" ? participantId : null,
    presidentId: participantKind === "president" ? participantId : null,
  };
}

function buildSessionRoleAssignmentDataFromProposalRooms(
  rooms: Array<{
    teamAssignments: Array<{
      speakerAssignments: Array<{
        memberId: string | null;
        cabinetId: string | null;
        presidentId: string | null;
      }>;
    }>;
    adjudicatorAssignments: Array<{
      memberId: string | null;
      cabinetId: string | null;
      presidentId: string | null;
      isChair: boolean;
    }>;
  }>,
) {
  return rooms.flatMap((room) => [
    ...room.teamAssignments.flatMap((team) =>
      team.speakerAssignments.map((speaker) => ({
        memberId: speaker.memberId,
        cabinetId: speaker.cabinetId,
        presidentId: speaker.presidentId,
        role: "speaker" as const,
        isChair: false,
      })),
    ),
    ...room.adjudicatorAssignments.map((adjudicator) => ({
      memberId: adjudicator.memberId,
      cabinetId: adjudicator.cabinetId,
      presidentId: adjudicator.presidentId,
      role: "adjudicator" as const,
      isChair: adjudicator.isChair,
    })),
  ]);
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

const BENCH_POSITION_ORDER = ["OG", "OO", "CG", "CO"] as const;
const SPEAKING_ROLES_BY_BENCH = {
  OG: ["PM", "DPM"],
  OO: ["LO", "DLO"],
  CG: ["MG", "GW"],
  CO: ["MO", "OW"],
} as const;
const PAIRING_WRITE_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 } as const;

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
      teams: room.teamAssignments
        .slice()
        .sort(
          (left, right) =>
            BENCH_POSITION_ORDER.indexOf(left.bpPosition as (typeof BENCH_POSITION_ORDER)[number]) -
            BENCH_POSITION_ORDER.indexOf(right.bpPosition as (typeof BENCH_POSITION_ORDER)[number]),
        )
        .map((team) => ({
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

function buildParticipantKindMap(assignments: SessionRoleAssignmentProjection[]): Map<MemberId, ParticipantKind> {
  return new Map(
    assignments.map((assignment) => {
      const participantId = resolveParticipantId(assignment);
      const participantKind = assignment.memberId
        ? "member"
        : assignment.cabinetId
          ? "cabinet"
          : "president";
      return [participantId, participantKind satisfies ParticipantKind];
    }),
  );
}

function buildActivePairingRules(sessionRulesJson: unknown): PairingGenerationContext["rules"] {
  if (!sessionRulesJson || typeof sessionRulesJson !== "object") {
    return {
      timeConstraints: [],
      forcedTeamUps: [],
      forcedSeparations: [],
      forcedChairParticipantId: null,
      forcedRoomCount: null,
    };
  }

  const record = sessionRulesJson as Record<string, unknown>;
  const timeConstraints: TimeConstraintRule[] = Array.isArray(record.timeConstraints)
    ? record.timeConstraints
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map((entry) => ({
          participantId: String(entry.participantId ?? "").trim(),
          isStrict: Boolean(entry.isStrict),
        }))
        .filter((entry) => entry.participantId.length > 0)
    : [];
  const forcedTeamUps: TeamUpRule[] = Array.isArray(record.eventTeamUpPreferences)
    ? record.eventTeamUpPreferences
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map((entry) => ({
          firstParticipantId: String(entry.firstParticipantId ?? "").trim(),
          secondParticipantId: String(entry.secondParticipantId ?? "").trim(),
          isStrict: Boolean(entry.isStrict),
        }))
        .filter((entry) => entry.firstParticipantId.length > 0 && entry.secondParticipantId.length > 0 && entry.firstParticipantId !== entry.secondParticipantId)
    : [];

  return {
    timeConstraints,
    forcedTeamUps,
    forcedSeparations: [],
    forcedChairParticipantId: null,
    forcedRoomCount: null,
  };
}
function parseManualAssignmentPayload(payload: Record<string, unknown>): ManualAssignmentPayload {
  if (!Array.isArray(payload.rooms)) {
    throw new Error("Manual override payload must include rooms.");
  }

  return {
    rooms: payload.rooms.map((room, roomIndex) => {
      if (!room || typeof room !== "object") {
        throw new Error(`Manual override room ${roomIndex + 1} is invalid.`);
      }
      const roomRecord = room as Record<string, unknown>;
      if (!Array.isArray(roomRecord.teams) || !Array.isArray(roomRecord.adjudicators)) {
        throw new Error(`Manual override room ${roomIndex + 1} must include teams and adjudicators.`);
      }
      return {
        roomIndex: Number(roomRecord.roomIndex ?? roomIndex + 1),
        teams: roomRecord.teams.map((team, teamIndex) => {
          if (!team || typeof team !== "object") {
            throw new Error(`Manual override team ${teamIndex + 1} in room ${roomIndex + 1} is invalid.`);
          }
          const teamRecord = team as Record<string, unknown>;
          if (!Array.isArray(teamRecord.speakers)) {
            throw new Error(`Manual override team ${teamIndex + 1} in room ${roomIndex + 1} must include speakers.`);
          }
          return {
            bpPosition: String(teamRecord.bpPosition ?? ""),
            speakers: teamRecord.speakers.map((speaker, speakerIndex) => {
              if (!speaker || typeof speaker !== "object") {
                throw new Error(`Manual override speaker ${speakerIndex + 1} in room ${roomIndex + 1} is invalid.`);
              }
              const speakerRecord = speaker as Record<string, unknown>;
              return {
                participantId: String(speakerRecord.participantId ?? ""),
                speakingRole: String(speakerRecord.speakingRole ?? ""),
              };
            }),
          };
        }),
        adjudicators: roomRecord.adjudicators.map((adjudicator, adjudicatorIndex) => {
          if (!adjudicator || typeof adjudicator !== "object") {
            throw new Error(`Manual override adjudicator ${adjudicatorIndex + 1} in room ${roomIndex + 1} is invalid.`);
          }
          const adjudicatorRecord = adjudicator as Record<string, unknown>;
          return {
            participantId: String(adjudicatorRecord.participantId ?? ""),
            isChair: Boolean(adjudicatorRecord.isChair),
          };
        }),
      };
    }),
    assignedParticipantIds: Array.isArray(payload.assignedParticipantIds)
      ? payload.assignedParticipantIds.map((participantId) => String(participantId))
      : undefined,
  };
}

function validateManualAssignmentPayload(
  payload: ManualAssignmentPayload,
  participantKindsById: Map<MemberId, ParticipantKind>,
): { assignedParticipantIds: Set<MemberId>; unassignedParticipantIds: MemberId[] } {
  const assignedParticipantIds = new Set<MemberId>();

  if (payload.rooms.length === 0) {
    throw new Error("Manual override must include at least one room.");
  }

  for (const room of payload.rooms) {
    if (room.teams.length != BENCH_POSITION_ORDER.length) {
      throw new Error(`Room ${room.roomIndex} must include OG, OO, CG, and CO.`);
    }

    for (const bpPosition of BENCH_POSITION_ORDER) {
      const team = room.teams.find((entry) => entry.bpPosition === bpPosition);
      if (!team) {
        throw new Error(`Room ${room.roomIndex} is missing ${bpPosition}.`);
      }
      const expectedRoles = SPEAKING_ROLES_BY_BENCH[bpPosition];
      if (team.speakers.length != expectedRoles.length) {
        throw new Error(`Room ${room.roomIndex} ${bpPosition} must contain exactly two speakers.`);
      }
      for (let index = 0; index < expectedRoles.length; index++) {
        const speaker = team.speakers[index];
        if (!speaker.participantId || !participantKindsById.has(speaker.participantId)) {
          throw new Error(`Room ${room.roomIndex} ${bpPosition} contains an unknown participant.`);
        }
        if (speaker.speakingRole !== expectedRoles[index]) {
          throw new Error(`Room ${room.roomIndex} ${bpPosition} must use roles ${expectedRoles.join(" / ")}.`);
        }
        if (assignedParticipantIds.has(speaker.participantId)) {
          throw new Error(`Participant ${speaker.participantId} is assigned more than once in the manual override.`);
        }
        assignedParticipantIds.add(speaker.participantId);
      }
    }

    if (room.adjudicators.length === 0 || room.adjudicators.length > 3) {
      throw new Error(`Room ${room.roomIndex} must contain between one and three adjudicators.`);
    }
    if (room.adjudicators.filter((adjudicator) => adjudicator.isChair).length !== 1) {
      throw new Error(`Room ${room.roomIndex} must contain exactly one chair.`);
    }
    for (const adjudicator of room.adjudicators) {
      if (!adjudicator.participantId || !participantKindsById.has(adjudicator.participantId)) {
        throw new Error(`Room ${room.roomIndex} contains an unknown adjudicator.`);
      }
      if (assignedParticipantIds.has(adjudicator.participantId)) {
        throw new Error(`Participant ${adjudicator.participantId} is assigned more than once in the manual override.`);
      }
      assignedParticipantIds.add(adjudicator.participantId);
    }
  }

  const unassignedParticipantIds = [...participantKindsById.keys()].filter(
    (participantId) => !assignedParticipantIds.has(participantId),
  );

  return { assignedParticipantIds, unassignedParticipantIds };
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
        sessionRulesJson: true,
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
      rules: buildActivePairingRules(sessionRecord.sessionRulesJson),
    };
  }

  async function saveGeneratedProposal(input: PersistGeneratedProposalInput): Promise<PairingProposalView> {
    const createdProposalId = await client.$transaction(async (tx: TransactionClient) => {
      const latestProposal = await tx.pairingProposal.findFirst({
        where: { sessionId: input.sessionId },
        orderBy: { proposalVersion: "desc" },
        select: { proposalVersion: true },
      });

      const proposalVersion = (latestProposal?.proposalVersion ?? 0) + 1;
      const createdProposal = await tx.pairingProposal.create({
        data: {
          sessionId: input.sessionId,
          proposalVersion,
          status: "GENERATED",
          engineVersion: input.audit.engineVersion,
          ruleVersion: input.audit.ruleVersion,
          topBandRank: input.audit.selectedRank,
          proposalScore: input.candidate.proposalScore,
          scoreBreakdownJson: {
            ...input.candidate.scoreBreakdown,
            audit: {
              metricSnapshotVersion: input.audit.metricSnapshotVersion,
              finalSelectionProbability: input.audit.selectedProbability,
              randomSeed: input.audit.seed,
              objective: input.audit.objective,
              topBandSize: input.audit.topBandSize,
            },
          },
          generatedBy: input.generatedBy,
          roomAssignments: {
            create: input.candidate.rooms.map((room) => ({
              roomIndex: room.roomIndex,
              roomScore: room.roomScore,
              roomBalanceScore: room.roomBalanceScore,
              roomDifficultyScore: room.roomDifficultyScore,
              teamAssignments: {
                create: room.teams.map((team) => ({
                  bpPosition: team.bpPosition,
                  teamScore: team.teamScore,
                  speakerAssignments: {
                    create: team.speakers.map((speaker, index) => ({
                      ...buildParticipantReferenceData(
                        speaker.participantId,
                        input.participantKindsById.get(speaker.participantId) ?? "member",
                      ),
                      speakingRole: speaker.speakingRole,
                      speakerOrder: index + 1,
                    })),
                  },
                })),
              },
              adjudicatorAssignments: {
                create: room.adjudicators.map((adjudicator) => ({
                  ...buildParticipantReferenceData(
                    adjudicator.participantId,
                    input.participantKindsById.get(adjudicator.participantId) ?? "member",
                  ),
                  isChair: adjudicator.isChair,
                  chairAssignmentScore: adjudicator.chairAssignmentScore,
                })),
              },
            })),
          },
        },
        select: { id: true },
      });

      if (input.candidate.unassignedParticipants.length > 0) {
        await tx.unassignedParticipant.createMany({
          data: input.candidate.unassignedParticipants.map((participant) => ({
            proposalId: createdProposal.id,
            ...buildParticipantReferenceData(
              participant.participantId,
              input.participantKindsById.get(participant.participantId) ?? "member",
            ),
            reason: participant.reason,
          })),
        });
      }

      await tx.debateSession.update({
        where: { id: input.sessionId },
        data: {
          pairingStatus: "GENERATED",
          publicationStatus: "DRAFT",
        },
      });

      return createdProposal.id;
    }, PAIRING_WRITE_TRANSACTION_OPTIONS);

    const proposal = await getPairingProposalView(createdProposalId);
    if (!proposal) {
      throw new Error(`Generated proposal ${createdProposalId} could not be materialized.`);
    }

    return proposal;
  }


  async function approveProposalReviewAction(proposalId: string, reviewerId: string): Promise<PairingProposalSummary> {
    const approvedProposalId = await client.$transaction(async (tx: TransactionClient) => {
      const proposal = await tx.pairingProposal.findUnique({
        where: { id: proposalId },
        select: {
          id: true,
          sessionId: true,
          status: true,
          isPublishedOfficially: true,
          session: {
            select: {
              publishedProposalId: true,
            },
          },
        },
      });

      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found.`);
      }

      if (proposal.isPublishedOfficially || proposal.status === "PUBLISHED" || proposal.session.publishedProposalId) {
        throw new Error(`Proposal ${proposalId} can no longer be approved because the session is already published.`);
      }

      if (proposal.status !== "GENERATED" && proposal.status !== "OVERRIDDEN" && proposal.status !== "APPROVED") {
        throw new Error(`Proposal ${proposalId} is not in an approvable state.`);
      }

      if (proposal.status !== "APPROVED") {
        await tx.pairingProposal.update({
          where: { id: proposalId },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
          },
        });

        await tx.proposalReviewLog.create({
          data: {
            proposalId,
            reviewerId,
            action: "APPROVE",
          },
        });

        await tx.debateSession.update({
          where: { id: proposal.sessionId },
          data: {
            acceptedProposalId: proposalId,
            pairingStatus: "APPROVED",
            publicationStatus: "DRAFT",
          },
        });
      }

      return proposalId;
    }, PAIRING_WRITE_TRANSACTION_OPTIONS);

    const approvedProposal = await getPairingProposalView(approvedProposalId);
    if (!approvedProposal) {
      throw new Error(`Approved proposal ${approvedProposalId} could not be materialized.`);
    }

    return approvedProposal.summary;
  }

  async function overrideProposalReviewAction(input: {
    proposalId: string;
    reviewerId: string;
    overrideType: string;
    payload: Record<string, unknown>;
    notes: string | null;
  }): Promise<PairingProposalView> {
    const overriddenProposalId = await client.$transaction(async (tx: TransactionClient) => {
      const proposal = await tx.pairingProposal.findUnique({
        where: { id: input.proposalId },
        select: {
          id: true,
          sessionId: true,
          status: true,
          isPublishedOfficially: true,
          scoreBreakdownJson: true,
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
          session: {
            select: {
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
            },
          },
        },
      });

      if (!proposal) {
        throw new Error(`Proposal ${input.proposalId} not found.`);
      }

      if (proposal.isPublishedOfficially || proposal.status === "PUBLISHED" || proposal.session.publishedProposalId) {
        throw new Error(`Proposal ${input.proposalId} can no longer be overridden because the session is already published.`);
      }

      const participantKindsById = buildParticipantKindMap(proposal.session.sessionRoleAssignments);
      const manualPayload = parseManualAssignmentPayload(input.payload);
      const { unassignedParticipantIds } = validateManualAssignmentPayload(manualPayload, participantKindsById);
      const existingBreakdown = (proposal.scoreBreakdownJson ?? {}) as Record<string, unknown>;
      const originalProposalState = {
        rooms: buildRoomViews(proposal),
        unassignedParticipants: buildUnassignedParticipants(proposal.unassignedParticipants),
      };
      const manualOverrideAudit = {
        overrideType: input.overrideType,
        payload: {
          ...manualPayload,
          unassignedParticipantIds,
        },
        originalProposalState,
        notes: input.notes,
        reviewerId: input.reviewerId,
        overriddenAt: new Date().toISOString(),
      };

      await tx.teamSpeakerAssignment.deleteMany({
        where: {
          teamAssignment: {
            roomAssignment: {
              proposalId: input.proposalId,
            },
          },
        },
      });
      await tx.roomAdjudicatorAssignment.deleteMany({
        where: {
          roomAssignment: {
            proposalId: input.proposalId,
          },
        },
      });
      await tx.debateTeamAssignment.deleteMany({
        where: {
          roomAssignment: {
            proposalId: input.proposalId,
          },
        },
      });
      await tx.debateRoomAssignment.deleteMany({
        where: {
          proposalId: input.proposalId,
        },
      });
      await tx.unassignedParticipant.deleteMany({ where: { proposalId: input.proposalId } });

      for (const room of manualPayload.rooms) {
        const createdRoom = await tx.debateRoomAssignment.create({
          data: {
            proposalId: input.proposalId,
            roomIndex: room.roomIndex,
            roomScore: null,
            roomBalanceScore: null,
            roomDifficultyScore: null,
          },
          select: { id: true },
        });

        for (const team of room.teams) {
          const createdTeam = await tx.debateTeamAssignment.create({
            data: {
              roomAssignmentId: createdRoom.id,
              bpPosition: team.bpPosition,
              teamScore: null,
            },
            select: { id: true },
          });

          await tx.teamSpeakerAssignment.createMany({
            data: team.speakers.map((speaker, index) => ({
              teamAssignmentId: createdTeam.id,
              ...buildParticipantReferenceData(
                speaker.participantId,
                participantKindsById.get(speaker.participantId) ?? "member",
              ),
              speakingRole: speaker.speakingRole,
              speakerOrder: index + 1,
            })),
          });
        }

        await tx.roomAdjudicatorAssignment.createMany({
          data: room.adjudicators.map((adjudicator) => ({
            roomAssignmentId: createdRoom.id,
            ...buildParticipantReferenceData(
              adjudicator.participantId,
              participantKindsById.get(adjudicator.participantId) ?? "member",
            ),
            isChair: adjudicator.isChair,
            chairAssignmentScore: null,
          })),
        });
      }

      if (unassignedParticipantIds.length > 0) {
        await tx.unassignedParticipant.createMany({
          data: unassignedParticipantIds.map((participantId) => ({
            proposalId: input.proposalId,
            ...buildParticipantReferenceData(
              participantId,
              participantKindsById.get(participantId) ?? "member",
            ),
            reason: "ADMIN_EXCLUDED",
          })),
        });
      }

      const roleAssignments = manualPayload.rooms.flatMap((room) => [
        ...room.teams.flatMap((team) =>
          team.speakers.map((speaker) => ({
            participantId: speaker.participantId,
            role: "speaker" as const,
            isChair: false,
          })),
        ),
        ...room.adjudicators.map((adjudicator) => ({
          participantId: adjudicator.participantId,
          role: "adjudicator" as const,
          isChair: adjudicator.isChair,
        })),
      ]);

      await tx.sessionRoleAssignment.deleteMany({ where: { sessionId: proposal.sessionId } });
      if (roleAssignments.length > 0) {
        await tx.sessionRoleAssignment.createMany({
          data: roleAssignments.map((assignment) => ({
            sessionId: proposal.sessionId,
            role: assignment.role,
            isChair: assignment.isChair,
            roleAssignedAt: new Date(),
            ...buildParticipantReferenceData(
              assignment.participantId,
              participantKindsById.get(assignment.participantId) ?? "member",
            ),
          })),
        });
      }

      await tx.pairingProposal.update({
        where: { id: input.proposalId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          scoreBreakdownJson: {
            ...existingBreakdown,
            manualOverride: manualOverrideAudit,
          },
        },
      });

      await tx.proposalReviewLog.create({
        data: {
          proposalId: input.proposalId,
          reviewerId: input.reviewerId,
          action: "OVERRIDE",
          notes: JSON.stringify(manualOverrideAudit),
        },
      });

      await tx.debateSession.update({
        where: { id: proposal.sessionId },
        data: {
          acceptedProposalId: input.proposalId,
          pairingStatus: "APPROVED",
          publicationStatus: "DRAFT",
        },
      });

      return input.proposalId;
    }, PAIRING_WRITE_TRANSACTION_OPTIONS);

    const overriddenProposal = await getPairingProposalView(overriddenProposalId);
    if (!overriddenProposal) {
      throw new Error(`Overridden proposal ${overriddenProposalId} could not be materialized.`);
    }

    return overriddenProposal;
  }

  async function recordRegenerateReviewAction(proposalId: string, reviewerId: string): Promise<{ sessionId: string }> {
    return client.$transaction(async (tx: TransactionClient) => {
      const proposal = await tx.pairingProposal.findUnique({
        where: { id: proposalId },
        select: {
          id: true,
          sessionId: true,
          status: true,
          isPublishedOfficially: true,
          session: {
            select: {
              publishedProposalId: true,
            },
          },
        },
      });

      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found.`);
      }

      if (proposal.isPublishedOfficially || proposal.status === "PUBLISHED" || proposal.session.publishedProposalId) {
        throw new Error(`Proposal ${proposalId} can no longer be regenerated because the session is already published.`);
      }

      await tx.proposalReviewLog.create({
        data: {
          proposalId,
          reviewerId,
          action: "REGENERATE",
        },
      });

      return {
        sessionId: proposal.sessionId,
      };
    });
  }

  async function upsertProposalRating(input: {
    proposalId: string;
    reviewerId: string;
    rating: number;
    issueTags: string[];
    notes: string | null;
  }): Promise<{
    proposalId: string;
    reviewerId: string;
    rating: number;
    issueTags: string[];
    notes: string | null;
  }> {
    return client.$transaction(async (tx: TransactionClient) => {
      const proposal = await tx.pairingProposal.findUnique({
        where: { id: input.proposalId },
        select: {
          id: true,
        },
      });

      if (!proposal) {
        throw new Error(`Proposal ${input.proposalId} not found.`);
      }

      await tx.proposalRating.upsert({
        where: {
          proposalId: input.proposalId,
        },
        update: {
          reviewerId: input.reviewerId,
          rating: input.rating,
          issueTagsJson: input.issueTags,
          notes: input.notes,
        },
        create: {
          proposalId: input.proposalId,
          reviewerId: input.reviewerId,
          rating: input.rating,
          issueTagsJson: input.issueTags,
          notes: input.notes,
        },
      });

      await tx.proposalReviewLog.create({
        data: {
          proposalId: input.proposalId,
          reviewerId: input.reviewerId,
          action: "RATE",
          notes: JSON.stringify({
            rating: input.rating,
            issueTags: input.issueTags,
            notes: input.notes,
          }),
        },
      });

      return {
        proposalId: input.proposalId,
        reviewerId: input.reviewerId,
        rating: input.rating,
        issueTags: input.issueTags,
        notes: input.notes,
      };
    });
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
    const publishedSessionId = await client.$transaction(async (tx: TransactionClient) => {
      const publishedSession = await tx.debateSession.findUnique({
        where: { id: input.sessionId },
        select: {
          publishedProposalId: true,
          publishedAt: true,
        },
      });

      if (publishedSession?.publishedProposalId && publishedSession.publishedAt) {
        return input.sessionId;
      }

      const approvedProposal = await tx.pairingProposal.findFirst({
        where: {
          sessionId: input.sessionId,
          status: "APPROVED",
        },
        orderBy: [{ approvedAt: "desc" }, { proposalVersion: "desc" }],
        select: {
          id: true,
          roomAssignments: {
            select: {
              teamAssignments: {
                select: {
                  speakerAssignments: {
                    select: {
                      memberId: true,
                      cabinetId: true,
                      presidentId: true,
                    },
                  },
                },
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
          },
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

      const roleAssignments = buildSessionRoleAssignmentDataFromProposalRooms(
        approvedProposal.roomAssignments,
      );
      await tx.sessionRoleAssignment.deleteMany({ where: { sessionId: input.sessionId } });
      if (roleAssignments.length > 0) {
        await tx.sessionRoleAssignment.createMany({
          data: roleAssignments.map((assignment) => ({
            sessionId: input.sessionId,
            role: assignment.role,
            isChair: assignment.isChair,
            roleAssignedAt: publishedAt,
            memberId: assignment.memberId,
            cabinetId: assignment.cabinetId,
            presidentId: assignment.presidentId,
          })),
        });
      }

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

      return input.sessionId;
    }, PAIRING_WRITE_TRANSACTION_OPTIONS);

    const publishedPairing = await getPublishedPairing(publishedSessionId);
    if (!publishedPairing) {
      throw new Error(`Published pairing could not be materialized for session ${publishedSessionId}.`);
    }

    return publishedPairing;
  }

  return {
    getGenerationContext,
    saveGeneratedProposal,
    approveProposalReviewAction,
    overrideProposalReviewAction,
    recordRegenerateReviewAction,
    upsertProposalRating,
    getPairingProposalView,
    getRoomAssignmentSummary,
    getPublishedPairing,
    publishProposalTransaction,
  };
}

export const pairingRepository = createPairingRepository();







