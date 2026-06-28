import { sessionRepository } from "../repositories/session-repository.ts";
import type { SessionRoleAssignmentView } from "../../../types/session.ts";

export interface AssignSessionRoleInput {
  sessionId: string;
  userId: string;
  role: SessionRoleAssignmentView["role"];
  isChair?: boolean;
}

interface SessionRepositoryContract {
  getSessionPreparationContext(sessionId: string): Promise<{
    attendance: Array<{ participantId: string; isPresent: boolean }>;
    sessionRoles: SessionRoleAssignmentView[];
  } | null>;
  replaceSessionRoles(
    sessionId: string,
    entries: Array<{ memberId: string; isPresent: boolean; sessionRole: "speaker" | "adjudicator" }>,
  ): Promise<void>;
}

export function createSessionRoleService(repository: SessionRepositoryContract = sessionRepository) {
  async function getUserSessionRole(
    sessionId: string,
    userId: string,
  ): Promise<SessionRoleAssignmentView | null> {
    const context = await repository.getSessionPreparationContext(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    return context.sessionRoles.find((assignment) => assignment.participantId === userId) ?? null;
  }

  async function assignSessionRole(
    input: AssignSessionRoleInput,
  ): Promise<SessionRoleAssignmentView | null> {
    const context = await repository.getSessionPreparationContext(input.sessionId);
    if (!context) {
      throw new Error(`Session ${input.sessionId} not found.`);
    }

    const attendanceRecord = context.attendance.find((record) => record.participantId === input.userId);
    if (!attendanceRecord?.isPresent) {
      throw new Error(`Cannot assign a session role to absent participant ${input.userId}.`);
    }

    const roleAssignments = new Map(
      context.sessionRoles.map((assignment) => [assignment.participantId, assignment.role]),
    );
    roleAssignments.set(input.userId, input.role);

    await repository.replaceSessionRoles(
      input.sessionId,
      [...roleAssignments.entries()].map(([memberId, sessionRole]) => ({
        memberId,
        isPresent: true,
        sessionRole,
      })),
    );

    return getUserSessionRole(input.sessionId, input.userId);
  }

  return {
    assignSessionRole,
    getUserSessionRole,
  };
}

export const { assignSessionRole, getUserSessionRole } = createSessionRoleService();