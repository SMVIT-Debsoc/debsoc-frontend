import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type {
  SessionMetadataView,
  SessionPreparationContextResponse,
  SessionRoleAssignmentEntry,
  SessionRoleAssignmentView,
  SessionRuleConfigView,
} from "../../../types/session.ts";
import type { MemberId, TeamUpRule, TimeConstraintRule } from "../../../types/pairing.ts";
import { resolveParticipantId } from "./metrics-repository.ts";

type SessionRepositoryClient = PrismaClient;
type ParticipantType = "member" | "cabinet" | "president";

function toSessionRole(role: string): SessionRoleAssignmentView["role"] {
  return role === "adjudicator" ? "adjudicator" : "speaker";
}

function emptySessionRules(): SessionRuleConfigView {
  return {
    timeConstraints: [],
    eventTeamUpPreferences: [],
  };
}

function normalizeTimeConstraints(value: unknown): TimeConstraintRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: TimeConstraintRule[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const participantId = typeof record.participantId === "string" ? record.participantId.trim() : "";
    if (!participantId || seen.has(participantId)) {
      continue;
    }

    seen.add(participantId);
    normalized.push({
      participantId,
      isStrict: Boolean(record.isStrict),
    });
  }

  return normalized;
}

function normalizeTeamUpPreferences(value: unknown): TeamUpRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: TeamUpRule[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const firstParticipantId = typeof record.firstParticipantId === "string" ? record.firstParticipantId.trim() : "";
    const secondParticipantId = typeof record.secondParticipantId === "string" ? record.secondParticipantId.trim() : "";
    if (!firstParticipantId || !secondParticipantId || firstParticipantId === secondParticipantId) {
      continue;
    }

    const key = [firstParticipantId, secondParticipantId].sort().join("::");
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push({
      firstParticipantId,
      secondParticipantId,
      isStrict: Boolean(record.isStrict),
    });
  }

  return normalized;
}

function normalizeSessionRules(value: unknown): SessionRuleConfigView {
  if (!value || typeof value !== "object") {
    return emptySessionRules();
  }

  const record = value as Record<string, unknown>;
  return {
    timeConstraints: normalizeTimeConstraints(record.timeConstraints),
    eventTeamUpPreferences: normalizeTeamUpPreferences(record.eventTeamUpPreferences),
  };
}

function toSessionMetadataView(session: {
  id: string;
  motionType: string | null;
  motiontype: string;
  motionText: string | null;
  pairingObjective: string | null;
  pairingStatus: string | null;
  publicationStatus: string | null;
  scoringStatus: string | null;
  acceptedProposalId: string | null;
  publishedProposalId: string | null;
  sessionRulesJson: unknown;
}): SessionMetadataView {
  return {
    sessionId: session.id,
    motionType: session.motionType ?? session.motiontype,
    motionText: session.motionText ?? "",
    pairingObjective: (session.pairingObjective ?? "BALANCED") as SessionMetadataView["pairingObjective"],
    pairingStatus: session.pairingStatus ?? "DRAFT",
    publicationStatus: session.publicationStatus ?? "DRAFT",
    scoringStatus: session.scoringStatus ?? "pending",
    acceptedProposalId: session.acceptedProposalId ?? null,
    publishedProposalId: session.publishedProposalId ?? null,
    sessionRules: normalizeSessionRules(session.sessionRulesJson),
  };
}

export function createSessionRepository(client: SessionRepositoryClient = prisma) {
  async function resolveParticipantTypesById(participantIds: string[]) {
    const uniqueIds = [...new Set(participantIds)];
    if (uniqueIds.length === 0) {
      return new Map<string, ParticipantType>();
    }

    const [members, cabinet, presidents] = await Promise.all([
      client.member.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      }),
      client.cabinet.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      }),
      client.president.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      }),
    ]);

    const map = new Map<string, ParticipantType>();
    members.forEach((record: { id: string }) => map.set(record.id, "member"));
    cabinet.forEach((record: { id: string }) => map.set(record.id, "cabinet"));
    presidents.forEach((record: { id: string }) => map.set(record.id, "president"));
    return map;
  }

  async function createSession(input: {
    sessionDate: Date;
    motionType: string;
    motionText: string;
    pairingObjective: string;
    chair: string;
    sessionRules?: SessionRuleConfigView;
  }): Promise<SessionMetadataView> {
    const created = await client.debateSession.create({
      data: {
        sessionDate: input.sessionDate,
        motiontype: input.motionType,
        motionType: input.motionType,
        motionText: input.motionText,
        pairingObjective: input.pairingObjective,
        pairingStatus: "DRAFT",
        publicationStatus: "DRAFT",
        scoringStatus: "pending",
        Chair: input.chair,
        sessionRulesJson: input.sessionRules ?? emptySessionRules(),
      },
      select: {
        id: true,
        motionType: true,
        motiontype: true,
        motionText: true,
        pairingObjective: true,
        pairingStatus: true,
        publicationStatus: true,
        scoringStatus: true,
        acceptedProposalId: true,
        publishedProposalId: true,
        sessionRulesJson: true,
      },
    });

    return toSessionMetadataView(created);
  }

  async function getSessionById(sessionId: string): Promise<SessionMetadataView | null> {
    const session = await client.debateSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        motionType: true,
        motiontype: true,
        motionText: true,
        pairingObjective: true,
        pairingStatus: true,
        publicationStatus: true,
        scoringStatus: true,
        acceptedProposalId: true,
        publishedProposalId: true,
        sessionRulesJson: true,
      },
    });

    return session ? toSessionMetadataView(session) : null;
  }

  async function getSessionPreparationContext(
    sessionId: string,
  ): Promise<SessionPreparationContextResponse | null> {
    const session = await client.debateSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        motionType: true,
        motiontype: true,
        motionText: true,
        pairingObjective: true,
        pairingStatus: true,
        publicationStatus: true,
        scoringStatus: true,
        acceptedProposalId: true,
        publishedProposalId: true,
        sessionRulesJson: true,
        attendance: {
          select: {
            memberId: true,
            cabinetId: true,
            presidentId: true,
            isPresent: true,
            isFinalized: true,
            wasAssigned: true,
            wasUnassigned: true,
            unassignedReason: true,
          },
        },
        sessionRoleAssignments: {
          select: {
            memberId: true,
            cabinetId: true,
            presidentId: true,
            role: true,
            isChair: true,
            roleAssignedAt: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      session: toSessionMetadataView(session),
      attendance: session.attendance
        .map((record: { memberId: string | null; cabinetId: string | null; presidentId: string | null; isPresent: boolean; isFinalized: boolean; wasAssigned: boolean; wasUnassigned: boolean; unassignedReason: string | null }) => {
          const participantId = resolveParticipantId(record);
          if (!participantId) {
            return null;
          }

          return {
            participantId,
            isPresent: record.isPresent,
            isFinalized: record.isFinalized,
            wasAssigned: record.wasAssigned,
            wasUnassigned: record.wasUnassigned,
            unassignedReason: (record.unassignedReason ?? null) as SessionPreparationContextResponse["attendance"][number]["unassignedReason"],
          };
        })
        .filter((record: SessionPreparationContextResponse["attendance"][number] | null): record is SessionPreparationContextResponse["attendance"][number] => record !== null),
      sessionRoles: session.sessionRoleAssignments
        .map((assignment: { memberId: string | null; cabinetId: string | null; presidentId: string | null; role: string; isChair: boolean; roleAssignedAt: Date | null }) => {
          const participantId = resolveParticipantId(assignment);
          if (!participantId) {
            return null;
          }

          return {
            participantId,
            role: toSessionRole(assignment.role),
            isChair: assignment.isChair,
            roleAssignedAt: assignment.roleAssignedAt?.toISOString() ?? null,
          };
        })
        .filter((assignment: SessionRoleAssignmentView | null): assignment is SessionRoleAssignmentView => assignment !== null),
    };
  }

  async function upsertAttendanceEntries(
    sessionId: string,
    entries: Array<{ participantId: MemberId; participantType: "member" | "cabinet" | "president"; isPresent: boolean }>,
  ) {
    const participantTypes = await resolveParticipantTypesById(
      entries.map((entry) => entry.participantId),
    );

    await client.attendance.deleteMany({ where: { sessionId } });

    if (entries.length === 0) {
      return { count: 0 };
    }

    return client.attendance.createMany({
      data: entries.map((entry) => {
        const participantType = participantTypes.get(entry.participantId) ?? entry.participantType;
        return {
          id: `${sessionId}:${participantType}:${entry.participantId}`,
          sessionId,
          status: entry.isPresent ? "present" : "absent",
          isPresent: entry.isPresent,
          memberId: participantType === "member" ? entry.participantId : null,
          cabinetId: participantType === "cabinet" ? entry.participantId : null,
          presidentId: participantType === "president" ? entry.participantId : null,
        };
      }),
    });
  }

  async function replaceSessionRoles(sessionId: string, entries: SessionRoleAssignmentEntry[]) {
    const participantTypes = await resolveParticipantTypesById(
      entries.map((entry) => entry.participantId),
    );

    await client.$transaction(async (tx: PrismaClient) => {
      await tx.sessionRoleAssignment.deleteMany({ where: { sessionId } });

      if (entries.length === 0) {
        return;
      }

      await tx.sessionRoleAssignment.createMany({
        data: entries.map((entry) => {
          const participantType = participantTypes.get(entry.participantId) ?? "member";
          return {
            sessionId,
            role: entry.sessionRole,
            isChair: false,
            roleAssignedAt: new Date(),
            memberId: participantType === "member" ? entry.participantId : null,
            cabinetId: participantType === "cabinet" ? entry.participantId : null,
            presidentId: participantType === "president" ? entry.participantId : null,
          };
        }),
      });
    });
  }

  async function updateSessionState(
    sessionId: string,
    data: Partial<{
      motionType: string;
      motionText: string;
      pairingObjective: string;
      pairingStatus: string;
      publicationStatus: string;
      scoringStatus: string;
      sessionRules: SessionRuleConfigView;
    }>,
  ) {
    return client.debateSession.update({
      where: { id: sessionId },
      data: {
        motiontype: data.motionType,
        motionType: data.motionType,
        motionText: data.motionText,
        pairingObjective: data.pairingObjective,
        pairingStatus: data.pairingStatus,
        publicationStatus: data.publicationStatus,
        scoringStatus: data.scoringStatus,
        ...(data.sessionRules ? { sessionRulesJson: data.sessionRules } : {}),
      },
      select: {
        id: true,
        motionType: true,
        motiontype: true,
        motionText: true,
        pairingObjective: true,
        pairingStatus: true,
        publicationStatus: true,
        scoringStatus: true,
        acceptedProposalId: true,
        publishedProposalId: true,
        sessionRulesJson: true,
      },
    });
  }

  async function deleteDraftSession(sessionId: string) {
    await client.$transaction(async (tx: PrismaClient) => {
      const proposalIds = (
        await tx.pairingProposal.findMany({
          where: { sessionId },
          select: { id: true },
        })
      ).map((proposal: { id: string }) => proposal.id);

      await tx.teamDynamicsRating.deleteMany({ where: { sessionId } });
      await tx.adjudicatorScoreRecord.deleteMany({ where: { sessionId } });
      await tx.chairFeedbackRecord.deleteMany({ where: { sessionId } });
      await tx.speakerScoreRecord.deleteMany({ where: { sessionId } });
      await tx.sessionRoleAssignment.deleteMany({ where: { sessionId } });
      await tx.attendance.deleteMany({ where: { sessionId } });

      if (proposalIds.length > 0) {
        await tx.teamSpeakerAssignment.deleteMany({
          where: {
            teamAssignment: {
              roomAssignment: {
                proposalId: { in: proposalIds },
              },
            },
          },
        });
        await tx.roomAdjudicatorAssignment.deleteMany({
          where: {
            roomAssignment: {
              proposalId: { in: proposalIds },
            },
          },
        });
        await tx.debateTeamAssignment.deleteMany({
          where: {
            roomAssignment: {
              proposalId: { in: proposalIds },
            },
          },
        });
        await tx.debateRoomAssignment.deleteMany({
          where: { proposalId: { in: proposalIds } },
        });
        await tx.unassignedParticipant.deleteMany({
          where: { proposalId: { in: proposalIds } },
        });
        await tx.proposalRating.deleteMany({
          where: { proposalId: { in: proposalIds } },
        });
        await tx.proposalReviewLog.deleteMany({
          where: { proposalId: { in: proposalIds } },
        });
        await tx.pairingProposal.deleteMany({
          where: { id: { in: proposalIds } },
        });
      }

      await tx.debateSession.delete({ where: { id: sessionId } });
    });
  }

  return {
    createSession,
    getSessionById,
    getSessionPreparationContext,
    upsertAttendanceEntries,
    replaceSessionRoles,
    updateSessionState,
    deleteDraftSession,
  };
}

export const sessionRepository = createSessionRepository();



