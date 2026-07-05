import { publishDashboardRealtimeEvent, publishSessionRealtimeEvent } from "../realtime/event-publisher.ts";
import {
  updateLearnedMetricsFromSession,
  updatePairMetricSnapshotsFromSession,
  updateRolePerformanceFromSession,
} from "../scoring/metric-update-service.ts";
import { scoringRepository } from "../repositories/scoring-repository.ts";
import { sessionRepository } from "../repositories/session-repository.ts";
import { invalidateTags } from "../cache/cache.ts";
import { CACHE_TAGS } from "../cache/keys.ts";
import type {
  CreateSessionRequest,
  SessionMetadataView,
  SessionPreparationContextResponse,
  SessionScoringStatusResponse,
  SessionScoringTaskStatus,
  SessionRuleConfigView,
  UpdateSessionRequest,
} from "../../../types/session.ts";
import type { DebsocRole } from "../roles.ts";

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

function emptySessionRules(): SessionRuleConfigView {
  return {
    timeConstraints: [],
    eventTeamUpPreferences: [],
  };
}

function normalizeSessionRules(value: unknown): SessionRuleConfigView {
  if (!value || typeof value !== "object") {
    return emptySessionRules();
  }

  const record = value as Record<string, unknown>;
  const timeConstraints = Array.isArray(record.timeConstraints)
    ? record.timeConstraints
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map((entry) => ({
          participantId: typeof entry.participantId === "string" ? entry.participantId.trim() : "",
          isStrict: Boolean(entry.isStrict),
        }))
        .filter((entry) => entry.participantId.length > 0)
    : [];

  const eventTeamUpPreferences = Array.isArray(record.eventTeamUpPreferences)
    ? record.eventTeamUpPreferences
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
        .map((entry) => ({
          firstParticipantId: typeof entry.firstParticipantId === "string" ? entry.firstParticipantId.trim() : "",
          secondParticipantId: typeof entry.secondParticipantId === "string" ? entry.secondParticipantId.trim() : "",
          isStrict: Boolean(entry.isStrict),
        }))
        .filter((entry) => entry.firstParticipantId.length > 0 && entry.secondParticipantId.length > 0)
        .filter((entry) => entry.firstParticipantId !== entry.secondParticipantId)
    : [];

  return {
    timeConstraints,
    eventTeamUpPreferences,
  };
}

export interface CreateSessionInput extends CreateSessionRequest {
  chair: string;
}
export interface UpdateSessionLifecycleStateInput extends Partial<UpdateSessionRequest> {
  sessionId: string;
  pairingStatus?: string;
  publicationStatus?: string;
  scoringStatus?: SessionMetadataView["scoringStatus"];
}

export interface GetSessionScoringStatusInput {
  sessionId: string;
  viewerId: string;
  viewerRole: DebsocRole;
}

interface SessionRepositoryContract {
  createSession(input: {
    sessionDate: Date;
    motionType: string;
    motionText: string;
    pairingObjective: string;
    chair: string;
  }): Promise<SessionMetadataView>;
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
      sessionRules: SessionRuleConfigView;
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
    acceptedProposalId: string | null;
    publishedProposalId: string | null;
    sessionRulesJson: unknown;
  }>;
  deleteDraftSession(sessionId: string): Promise<void>;
}

interface ScoringRepositoryContract {
  getPublishedScoringContext(sessionId: string): Promise<{
    proposalId: string | null;
    publicationStatus: string;
    roles: Array<{ participantId: string; role: string; isChair: boolean }>;
    rooms: Array<{
      speakers: Array<{ participantId: string }>;
      adjudicators: Array<{ participantId: string; isChair: boolean }>;
    }>;
  } | null>;
  getChairFeedbackBySession(sessionId: string): Promise<Array<{
    speakerMemberId: string | null;
    speakerCabinetId: string | null;
    speakerPresidentId: string | null;
    chairMemberId: string | null;
    chairCabinetId: string | null;
    chairPresidentId: string | null;
    rating: number;
  }>>;
  getAdjudicatorScoreRecordsBySession(sessionId: string): Promise<Array<{
    chairMemberId: string | null;
    chairCabinetId: string | null;
    chairPresidentId: string | null;
    adjudicatorMemberId: string | null;
    adjudicatorCabinetId: string | null;
    adjudicatorPresidentId: string | null;
    rating: number;
  }>>;
  getSpeakerScoreRecordsBySession(sessionId: string): Promise<Array<{
    memberId: string | null;
    cabinetId: string | null;
    presidentId: string | null;
    scoredByMemberId: string | null;
    scoredByCabinetId: string | null;
    scoredByPresidentId: string | null;
    bpPosition: string;
    speakingRole: string;
    rawScore: number;
    teamResultPoints: number;
    session: {
      motionType: string | null;
      motiontype: string;
    };
  }>>;
}

function resolveParticipantId(ref: Record<string, string | number | null | undefined>) {
  for (const value of Object.values(ref)) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return null;
}

function normalizePairingStatus(status: string | null | undefined): string {
  return (status ?? pairingStatuses.draft).toUpperCase();
}

function normalizePublicationStatus(status: string | null | undefined): string {
  return (status ?? publicationStatuses.draft).toUpperCase();
}

function normalizeScoringStatus(status: string | null | undefined): SessionScoringStatusResponse["scoringStatus"] {
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
    if (!([pairingStatuses.approved, pairingStatuses.published] as string[]).includes(nextPairingStatus)) {
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
  acceptedProposalId: string | null;
  publishedProposalId: string | null;
  sessionRulesJson: unknown;
}): SessionMetadataView {
  return {
    sessionId: result.id,
    motionType: result.motionType ?? result.motiontype,
    motionText: result.motionText ?? "",
    pairingObjective: (result.pairingObjective ?? "BALANCED") as SessionMetadataView["pairingObjective"],
    pairingStatus: result.pairingStatus ?? pairingStatuses.draft,
    publicationStatus: result.publicationStatus ?? publicationStatuses.draft,
    scoringStatus: normalizeScoringStatus(result.scoringStatus),
    acceptedProposalId: result.acceptedProposalId ?? null,
    publishedProposalId: result.publishedProposalId ?? null,
    sessionRules: normalizeSessionRules(result.sessionRulesJson),
  } satisfies SessionMetadataView;
}

export function createSessionService(
  repository: SessionRepositoryContract = sessionRepository,
  scoringReadRepository: ScoringRepositoryContract = scoringRepository as ScoringRepositoryContract,
  publishEvent: typeof publishSessionRealtimeEvent = publishSessionRealtimeEvent,
  publishDashboardEvent: typeof publishDashboardRealtimeEvent = publishDashboardRealtimeEvent,
  rebuildSessionMetrics: (sessionId: string) => Promise<void> = async (sessionId) => {
    // Idempotent upserts: safe to run whenever scoring finalizes. This guarantees
    // metric snapshots exist for a completed session even if individual score
    // submissions bypassed the per-submission metric trigger (e.g. bulk import).
    await updateLearnedMetricsFromSession(sessionId);
    await updatePairMetricSnapshotsFromSession(sessionId);
    await updateRolePerformanceFromSession(sessionId);
  },
) {
  async function createSession(input: CreateSessionInput): Promise<SessionMetadataView> {
    const created = await repository.createSession({
      sessionDate: input.sessionDate ? new Date(input.sessionDate) : new Date(),
      motionType: input.motionType ?? "TBD",
      motionText: input.motionText ?? "To be announced",
      pairingObjective: input.pairingObjective ?? "BALANCED",
      chair: input.chair,
    });

    await invalidateTags([CACHE_TAGS.sessions]);

    await publishEvent(created.sessionId, {
      eventId: `session.created:${created.sessionId}:${Date.now()}`,
      eventType: "session.updated",
      occurredAt: new Date().toISOString(),
      sessionId: created.sessionId,
      proposalId: null,
      visibility: "ADMIN_ONLY",
      refetchHints: ["session_detail"],
      entityVersion: `${created.pairingStatus}:${created.publicationStatus}:${created.scoringStatus}`,
    });

    await publishDashboardEvent({
      eventId: `dashboard.changed:session:${created.sessionId}:${Date.now()}`,
      eventType: "dashboard.changed",
      occurredAt: new Date().toISOString(),
      sessionId: null,
      proposalId: null,
      visibility: "MEMBER_SAFE",
      refetchHints: ["dashboard"],
      entityVersion: `${created.sessionId}:${created.pairingStatus}:${created.publicationStatus}:${created.scoringStatus}`,
    });
    return created;
  }

  async function getSessionPreparationContext(sessionId: string): Promise<SessionPreparationContextResponse> {
    const context = await repository.getSessionPreparationContext(sessionId);
    if (!context) {
      throw new Error(`Session ${sessionId} not found.`);
    }
    return context;
  }

  async function getSessionScoringStatus(input: GetSessionScoringStatusInput): Promise<SessionScoringStatusResponse> {
    const [session, context, chairFeedbackRecords, adjudicatorScoreRecords, speakerScoreRecords] = await Promise.all([
      repository.getSessionById(input.sessionId),
      scoringReadRepository.getPublishedScoringContext(input.sessionId),
      scoringReadRepository.getChairFeedbackBySession(input.sessionId),
      scoringReadRepository.getAdjudicatorScoreRecordsBySession(input.sessionId),
      scoringReadRepository.getSpeakerScoreRecordsBySession(input.sessionId),
    ]);

    if (!session) {
      throw new Error(`Session ${input.sessionId} not found.`);
    }

    const speakerSubmittedIds = new Set(
      chairFeedbackRecords
        .map((record) => resolveParticipantId(record))
        .filter((participantId): participantId is string => participantId !== null),
    );

    const adjudicatorScoresByChair = new Map<string, number>();
    for (const record of adjudicatorScoreRecords) {
      const chairId = resolveParticipantId({
        chairMemberId: record.chairMemberId,
        chairCabinetId: record.chairCabinetId,
        chairPresidentId: record.chairPresidentId,
      });
      if (!chairId) continue;
      adjudicatorScoresByChair.set(chairId, (adjudicatorScoresByChair.get(chairId) ?? 0) + 1);
    }

    const speakerScoresByChair = new Map<string, number>();
    for (const record of speakerScoreRecords) {
      const chairId = resolveParticipantId({
        scoredByMemberId: record.scoredByMemberId,
        scoredByCabinetId: record.scoredByCabinetId,
        scoredByPresidentId: record.scoredByPresidentId,
      });
      if (!chairId) continue;
      speakerScoresByChair.set(chairId, (speakerScoresByChair.get(chairId) ?? 0) + 1);
    }

    const chairRequirements = new Map<string, { speakerCount: number; adjudicatorCount: number }>();
    for (const room of context?.rooms ?? []) {
      const chairId = room.adjudicators.find((adjudicator) => adjudicator.isChair)?.participantId;
      if (!chairId) continue;
      chairRequirements.set(chairId, {
        speakerCount: room.speakers.length,
        adjudicatorCount: room.adjudicators.filter((adjudicator) => !adjudicator.isChair).length,
      });
    }

    const tasks: SessionScoringTaskStatus[] = [];
    for (const role of context?.roles ?? []) {
      if (role.role === "speaker") {
        tasks.push({
          participantId: role.participantId,
          sessionRole: "speaker",
          hasSubmitted: speakerSubmittedIds.has(role.participantId),
        });
        continue;
      }

      if (role.role === "adjudicator" && role.isChair) {
        const requirement = chairRequirements.get(role.participantId) ?? { speakerCount: 0, adjudicatorCount: 0 };
        const hasSpeakerScores = (speakerScoresByChair.get(role.participantId) ?? 0) >= requirement.speakerCount;
        const hasAdjudicatorScores = requirement.adjudicatorCount === 0
          ? true
          : (adjudicatorScoresByChair.get(role.participantId) ?? 0) >= requirement.adjudicatorCount;
        tasks.push({
          participantId: role.participantId,
          sessionRole: "adjudicator",
          hasSubmitted: hasSpeakerScores && hasAdjudicatorScores,
        });
      }
    }

    const visibleTasks = input.viewerRole === "Member"
      ? tasks.filter((task) => task.participantId === input.viewerId)
      : tasks;

    const submittedCount = tasks.filter((task) => task.hasSubmitted).length;
    const scoringStatus: SessionScoringStatusResponse["scoringStatus"] = tasks.length === 0
      ? normalizeScoringStatus(session.scoringStatus)
      : submittedCount === 0
        ? "pending"
        : submittedCount === tasks.length
          ? "complete"
          : "partial";

    return {
      sessionId: input.sessionId,
      scoringStatus,
      tasks: visibleTasks,
    };
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
      sessionRules: input.sessionRules,
    });

    const view = toSessionMetadataView(updated);

    // Finalizing scoring must build the learned metric snapshots that power
    // progress profiles and leaderboards. Only fire on the transition into
    // "complete" so re-saves of an already-complete session don't rebuild.
    const wasComplete =
      normalizeScoringStatus(currentSession.scoringStatus) === scoringStatuses.complete;
    if (view.scoringStatus === scoringStatuses.complete && !wasComplete) {
      await rebuildSessionMetrics(input.sessionId);
    }

    await invalidateTags([CACHE_TAGS.sessions, CACHE_TAGS.progress, CACHE_TAGS.leaderboard]);

    await publishEvent(input.sessionId, {
      eventId: `session.updated:${input.sessionId}:${Date.now()}`,
      eventType: "session.updated",
      occurredAt: new Date().toISOString(),
      sessionId: input.sessionId,
      proposalId: null,
      visibility: "ADMIN_ONLY",
      refetchHints: ["session_detail"],
      entityVersion: `${view.pairingStatus}:${view.publicationStatus}:${view.scoringStatus}`,
    });

    if (view.scoringStatus === "open") {
      await publishEvent(input.sessionId, {
        eventId: `scoring.window.opened:${input.sessionId}:${Date.now()}`,
        eventType: "scoring.window.opened",
        occurredAt: new Date().toISOString(),
        sessionId: input.sessionId,
        proposalId: null,
        visibility: "MEMBER_SAFE",
        refetchHints: ["scoring_status"],
        entityVersion: view.scoringStatus,
      });
    }

    if (view.scoringStatus === "complete") {
      await publishEvent(input.sessionId, {
        eventId: `scoring.completed:${input.sessionId}:${Date.now()}`,
        eventType: "scoring.completed",
        occurredAt: new Date().toISOString(),
        sessionId: input.sessionId,
        proposalId: null,
        visibility: "MEMBER_SAFE",
        refetchHints: ["scoring_status", "leaderboard"],
        entityVersion: view.scoringStatus,
      });
    }

    return view;
  }

  async function cancelSession(sessionId: string): Promise<void> {
    const currentSession = await repository.getSessionById(sessionId);
    if (!currentSession) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    if (
      normalizePublicationStatus(currentSession.publicationStatus) === publicationStatuses.published ||
      normalizePairingStatus(currentSession.pairingStatus) === pairingStatuses.published
    ) {
      throw new Error("Only unpublished in-progress sessions can be cancelled.");
    }

    await repository.deleteDraftSession(sessionId);
    await invalidateTags([CACHE_TAGS.sessions, CACHE_TAGS.progress, CACHE_TAGS.leaderboard]);
  }

  return {
    createSession,
    getSessionPreparationContext,
    getSessionScoringStatus,
    updateSessionLifecycleState,
    cancelSession,
  };
}

export const { createSession, getSessionPreparationContext, getSessionScoringStatus, updateSessionLifecycleState, cancelSession } = createSessionService();


