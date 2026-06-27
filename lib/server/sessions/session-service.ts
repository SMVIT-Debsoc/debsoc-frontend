import { sessionRepository } from "../repositories/session-repository.ts";
import type { SessionMetadataView, SessionPreparationContextResponse, UpdateSessionRequest } from "../../../types/session.ts";

const pairingStatuses = {
  draft: "DRAFT",
  preparation: "PREPARATION",
  ready: "READY",
  generated: "GENERATED",
  approved: "APPROVED",
  published: "PUBLISHED",
} as const;

const publicationStatuses = {
  draft: "DRAFT",
  published: "PUBLISHED",
} as const;

const scoringStatuses = {
  pending: "pending",
  open: "open",
  partial: "partial",
  complete: "complete",
} as const;

export interface UpdateSessionLifecycleStateInput extends Partial<UpdateSessionRequest> {
  sessionId: string;
  pairingStatus?: string;
  publicationStatus?: string;
  scoringStatus?: SessionMetadataView["scoringStatus"];
}

interface SessionRepositoryContract {
  getSessionById(sessionId: string): Promise<SessionMetadataView | null>;
  getSessionPreparationContext(sessionId: string): Promise<SessionPreparationContextResponse | null>;
  updateSessionState(
    sessionId: string,
    data: Partial<{
      motionType: string;
      motionText: string;
      pairingObjective: string;
      pairingStatus: string;
      publicationStatus: string;
      scoringStatus: string;
    }>,
  ): Promise<{
    id: string;
    motionType: string | null;
    motiontype: string;
    motionText: string | null;
    pairingObjective: string | null;
    pairingStatus: string | null;
    publicationStatus: string | null;
    scoringStatus: string | null;
  }>;
}

function normalizePairingStatus(status: string | null | undefined): string {
  return (status ?? pairingStatuses.draft).toUpperCase();
}

function normalizePublicationStatus(status: string | null | undefined): string {
  return (status ?? publicationStatuses.draft).toUpperCase();
}

function normalizeScoringStatus(status: string | null | undefined): SessionMetadataView["scoringStatus"] {
  const value = (status ?? scoringStatuses.pending).toLowerCase();
  if (value === scoringStatuses.open || value === scoringStatuses.partial || value === scoringStatuses.complete) {
    return value;
  }
  return scoringStatuses.pending;
}

function assertValidPreparedPool(context: SessionPreparationContextResponse) {
  const presentParticipants = context.attendance.filter((record) => record.isPresent);
  if (presentParticipants.length === 0) {
    throw new Error("Cannot move session forward without at least one present participant.");
  }

  const assignedRoleParticipantIds = new Set(context.sessionRoles.map((assignment) => assignment.participantId));
  const hasUnassignedPresentParticipant = presentParticipants.some(
    (participant) => !assignedRoleParticipantIds.has(participant.participantId),
  );

  if (hasUnassignedPresentParticipant) {
    throw new Error("Cannot move session forward until every present participant has a session role.");
  }
}

function assertLifecycleTransition(
  current: SessionMetadataView,
  next: UpdateSessionLifecycleStateInput,
  context: SessionPreparationContextResponse,
) {
  const currentPairingStatus = normalizePairingStatus(current.pairingStatus);
  const nextPairingStatus = normalizePairingStatus(next.pairingStatus ?? current.pairingStatus);
  const nextPublicationStatus = normalizePublicationStatus(
    next.publicationStatus ?? current.publicationStatus,
  );
  const nextScoringStatus = normalizeScoringStatus(next.scoringStatus ?? current.scoringStatus);

  const allowedPairingTransitions = new Map<string, string[]>([
    [pairingStatuses.draft, [pairingStatuses.draft, pairingStatuses.preparation]],
    [pairingStatuses.preparation, [pairingStatuses.preparation, pairingStatuses.ready]],
    [pairingStatuses.ready, [pairingStatuses.ready, pairingStatuses.generated]],
    [pairingStatuses.generated, [pairingStatuses.generated, pairingStatuses.approved]],
    [pairingStatuses.approved, [pairingStatuses.approved, pairingStatuses.published]],
    [pairingStatuses.published, [pairingStatuses.published]],
  ]);

  const allowedTargets = allowedPairingTransitions.get(currentPairingStatus) ?? [currentPairingStatus];
  if (!allowedTargets.includes(nextPairingStatus)) {
    throw new Error(
      `Illegal lifecycle transition from ${currentPairingStatus} to ${nextPairingStatus}.`,
    );
  }

  if (nextPairingStatus === pairingStatuses.ready) {
    assertValidPreparedPool(context);
  }

  if (nextPublicationStatus === publicationStatuses.published) {
    if (!( [pairingStatuses.approved, pairingStatuses.published] as string[] ).includes(nextPairingStatus)) {
      throw new Error("Cannot publish a session before a proposal reaches the approved state.");
    }
  }

  if (([scoringStatuses.open, scoringStatuses.partial, scoringStatuses.complete] as string[]).includes(nextScoringStatus)) {
    if (nextPublicationStatus !== publicationStatuses.published) {
      throw new Error("Cannot open or complete scoring before publication.");
    }
  }
}

function toSessionMetadataView(result: {
  id: string;
  motionType: string | null;
  motiontype: string;
  motionText: string | null;
  pairingObjective: string | null;
  pairingStatus: string | null;
  publicationStatus: string | null;
  scoringStatus: string | null;
}): SessionMetadataView {
  return {
    sessionId: result.id,
    motionType: result.motionType ?? result.motiontype,
    motionText: result.motionText ?? "",
    pairingObjective: (result.pairingObjective ?? "BALANCED") as SessionMetadataView["pairingObjective"],
    pairingStatus: result.pairingStatus ?? pairingStatuses.draft,
    publicationStatus: result.publicationStatus ?? publicationStatuses.draft,
    scoringStatus: normalizeScoringStatus(result.scoringStatus),
  };
}

export function createSessionService(repository: SessionRepositoryContract = sessionRepository) {
  async function getSessionPreparationContext(sessionId: string): Promise<SessionPreparationContextResponse> {
    const context = await repository.getSessionPreparationContext(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found.`);
    }
    return context;
  }

  async function updateSessionLifecycleState(
    input: UpdateSessionLifecycleStateInput,
  ): Promise<SessionMetadataView> {
    const currentSession = await repository.getSessionById(input.sessionId);
    if (!currentSession) {
      throw new Error(`Session ${input.sessionId} not found.`);
    }

    const preparationContext = await getSessionPreparationContext(input.sessionId);
    assertLifecycleTransition(currentSession, input, preparationContext);

    const updated = await repository.updateSessionState(input.sessionId, {
      motionType: input.motionType,
      motionText: input.motionText,
      pairingObjective: input.pairingObjective,
      pairingStatus: input.pairingStatus,
      publicationStatus: input.publicationStatus,
      scoringStatus: input.scoringStatus,
    });

    return toSessionMetadataView(updated);
  }

  return {
    getSessionPreparationContext,
    updateSessionLifecycleState,
  };
}

export const { getSessionPreparationContext, updateSessionLifecycleState } = createSessionService();