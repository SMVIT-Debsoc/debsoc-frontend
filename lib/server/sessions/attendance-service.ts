import { pairingRepository } from "../repositories/pairing-repository.ts";
import { sessionRepository } from "../repositories/session-repository.ts";
import type { AttendancePreparationRequest, MarkAttendanceRequest, SessionPreparationContextResponse } from "../../../types/session.ts";

interface SessionRepositoryContract {
  getSessionById(sessionId: string): Promise<unknown | null>;
  getSessionPreparationContext(sessionId: string): Promise<SessionPreparationContextResponse | null>;
  upsertAttendanceEntries(
    sessionId: string,
    entries: Array<{
      participantId: string;
      participantType: "member" | "cabinet" | "president";
      isPresent: boolean;
    }>,
  ): Promise<unknown>;
  replaceSessionRoles(
    sessionId: string,
    entries: Array<{ memberId: string; isPresent: boolean; sessionRole: "speaker" | "adjudicator" }>,
  ): Promise<void>;
  updateSessionState(
    sessionId: string,
    data: Partial<{ pairingStatus: string; publicationStatus: string }>,
  ): Promise<unknown>;
}

interface PairingRepositoryContract {
  getPublishedPairing(sessionId: string): Promise<unknown | null>;
}

export function createAttendanceService(
  repository: SessionRepositoryContract = sessionRepository,
  pairingRepo: PairingRepositoryContract = pairingRepository,
) {
  async function prepareAttendance(
    input: AttendancePreparationRequest,
  ): Promise<SessionPreparationContextResponse> {
    const session = await repository.getSessionById(input.sessionId);
    if (!session) {
      throw new Error(`Session ${input.sessionId} not found.`);
    }

    await repository.updateSessionState(input.sessionId, {
      pairingStatus: "PREPARATION",
      publicationStatus: "DRAFT",
    });

    const context = await repository.getSessionPreparationContext(input.sessionId);
    if (!context) {
      throw new Error(`Session ${input.sessionId} preparation context is unavailable.`);
    }

    return context;
  }

  async function markAttendance(input: MarkAttendanceRequest): Promise<SessionPreparationContextResponse> {
    await prepareAttendance({ sessionId: input.sessionId });

    await repository.upsertAttendanceEntries(
      input.sessionId,
      input.entries.map((entry) => ({
        participantId: entry.memberId,
        participantType: "member",
        isPresent: entry.isPresent,
      })),
    );

    await repository.replaceSessionRoles(
      input.sessionId,
      input.entries.filter((entry) => entry.isPresent),
    );

    const context = await repository.getSessionPreparationContext(input.sessionId);
    if (!context) {
      throw new Error(`Session ${input.sessionId} preparation context is unavailable after attendance mark.`);
    }

    return context;
  }

  async function finalizeAttendanceFromPublishedPairing(
    sessionId: string,
  ): Promise<SessionPreparationContextResponse> {
    const publishedPairing = await pairingRepo.getPublishedPairing(sessionId);
    if (!publishedPairing) {
      throw new Error(`Cannot finalize attendance before a pairing is published for session ${sessionId}.`);
    }

    const context = await repository.getSessionPreparationContext(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} preparation context is unavailable.`);
    }

    return context;
  }

  return {
    prepareAttendance,
    markAttendance,
    finalizeAttendanceFromPublishedPairing,
  };
}

export const { prepareAttendance, markAttendance, finalizeAttendanceFromPublishedPairing } =
  createAttendanceService();