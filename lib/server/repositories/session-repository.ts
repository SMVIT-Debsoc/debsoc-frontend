import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type {
  SessionMetadataView,
  SessionPreparationContextResponse,
  SessionRoleAssignmentEntry,
  SessionRoleAssignmentView,
} from "../../../types/session.ts";
import type { MemberId } from "../../../types/pairing.ts";
import { resolveParticipantId } from "./metrics-repository.ts";

type SessionRepositoryClient = PrismaClient;

function toSessionRole(role: string): SessionRoleAssignmentView["role"] {
  return role === "adjudicator" ? "adjudicator" : "speaker";
}

export function createSessionRepository(client: SessionRepositoryClient = prisma) {
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
      },
    });

    if (!session) {
      return null;
    }

    return {
      sessionId: session.id,
      motionType: session.motionType ?? session.motiontype,
      motionText: session.motionText ?? "",
      pairingObjective: (session.pairingObjective ?? "BALANCED") as SessionMetadataView["pairingObjective"],
      pairingStatus: session.pairingStatus ?? "draft",
      publicationStatus: session.publicationStatus ?? "draft",
      scoringStatus: session.scoringStatus ?? "pending",
    };
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
      session: {
        sessionId: session.id,
        motionType: session.motionType ?? session.motiontype,
        motionText: session.motionText ?? "",
        pairingObjective: (session.pairingObjective ?? "BALANCED") as SessionMetadataView["pairingObjective"],
        pairingStatus: session.pairingStatus ?? "draft",
        publicationStatus: session.publicationStatus ?? "draft",
        scoringStatus: session.scoringStatus ?? "pending",
      },
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
    return client.$transaction(
      entries.map((entry) =>
        client.attendance.upsert({
          where: {
            id: `${sessionId}:${entry.participantType}:${entry.participantId}`,
          },
          create: {
            id: `${sessionId}:${entry.participantType}:${entry.participantId}`,
            sessionId,
            status: entry.isPresent ? "present" : "absent",
            isPresent: entry.isPresent,
            memberId: entry.participantType === "member" ? entry.participantId : null,
            cabinetId: entry.participantType === "cabinet" ? entry.participantId : null,
            presidentId: entry.participantType === "president" ? entry.participantId : null,
          },
          update: {
            status: entry.isPresent ? "present" : "absent",
            isPresent: entry.isPresent,
          },
        }),
      ),
    );
  }

  async function replaceSessionRoles(sessionId: string, entries: SessionRoleAssignmentEntry[]) {
    await client.$transaction(async (tx: PrismaClient) => {
      await tx.sessionRoleAssignment.deleteMany({ where: { sessionId } });

      if (entries.length === 0) {
        return;
      }

      await tx.sessionRoleAssignment.createMany({
        data: entries.map((entry) => ({
          sessionId,
          role: entry.sessionRole,
          isChair: false,
          roleAssignedAt: new Date(),
          memberId: entry.memberId,
        })),
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
    }>,
  ) {
    return client.debateSession.update({
      where: { id: sessionId },
      data,
      select: {
        id: true,
        motionType: true,
        motiontype: true,
        motionText: true,
        pairingObjective: true,
        pairingStatus: true,
        publicationStatus: true,
        scoringStatus: true,
      },
    });
  }

  return {
    getSessionById,
    getSessionPreparationContext,
    upsertAttendanceEntries,
    replaceSessionRoles,
    updateSessionState,
  };
}

export const sessionRepository = createSessionRepository();