import type { ChairScoringRequest, ScoreSubmissionResponse } from "../../../types/scoring.ts";
import { publishSessionRealtimeEvent } from "../realtime/event-publisher.ts";
import { scoringRepository } from "../repositories/scoring-repository.ts";
import {
  updateLearnedMetricsFromSession,
  updatePairMetricSnapshotsFromSession,
  updateRolePerformanceFromSession,
} from "./metric-update-service.ts";
import { invalidateTags } from "../cache/cache.ts";
import { CACHE_TAGS } from "../cache/keys.ts";

type ParticipantType = "member" | "cabinet" | "president";

export class ChairScoringError extends Error {
  code:
    | "SESSION_NOT_FOUND"
    | "SCORING_NOT_OPEN"
    | "SESSION_ROLE_REQUIRED"
    | "SUBMISSION_CONFLICT";

  constructor(
    code: "SESSION_NOT_FOUND" | "SCORING_NOT_OPEN" | "SESSION_ROLE_REQUIRED" | "SUBMISSION_CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "ChairScoringError";
    this.code = code;
  }
}

interface ChairScoringRepositoryContract {
  getPublishedScoringContext(sessionId: string): Promise<{
    proposalId: string | null;
    publicationStatus: string;
    roles: Array<{ participantId: string; role: string; isChair: boolean }>;
    rooms: Array<{
      speakers: Array<{ participantId: string; bpPosition: string; speakingRole: string }>;
      adjudicators: Array<{ participantId: string; isChair: boolean }>;
    }>;
    motionType: string;
  } | null>;
  getParticipantTypes(participantIds: string[]): Promise<Map<string, ParticipantType>>;
  getExistingAdjudicatorScoreRecords(sessionId: string, chairParticipantId: string): Promise<Array<{
    adjudicatorMemberId: string | null;
    adjudicatorCabinetId: string | null;
    adjudicatorPresidentId: string | null;
    rating: number;
    notes: string | null;
  }>>;
  createAdjudicatorScoreRecords(input: {
    sessionId: string;
    proposalId: string;
    chairParticipantId: string;
    chairParticipantType: ParticipantType;
    adjudicatorScores: Array<{
      participantId: string;
      participantType: ParticipantType;
      rating: number;
      notes?: string | null;
    }>;
  }): Promise<{ count: number }>;
  getExistingSpeakerScoreRecords(sessionId: string, scoredByParticipantId: string): Promise<Array<{
    memberId: string | null;
    cabinetId: string | null;
    presidentId: string | null;
    bpPosition: string;
    speakingRole: string;
    rawScore: number;
    teamResultPoints: number;
  }>>;
  createSpeakerScoreRecords(
    sessionId: string,
    proposalId: string,
    records: Array<{
      participantId: string;
      participantType: ParticipantType;
      bpPosition: string;
      speakingRole: string;
      rawScore: number;
      teamResultPoints: number;
      scoredByParticipantId: string;
      scoredByParticipantType: ParticipantType;
    }>,
  ): Promise<{ count: number }>;
}

function resolveParticipantId(ref: {
  memberId?: string | null;
  cabinetId?: string | null;
  presidentId?: string | null;
  adjudicatorMemberId?: string | null;
  adjudicatorCabinetId?: string | null;
  adjudicatorPresidentId?: string | null;
}) {
  return (
    ref.memberId ??
    ref.cabinetId ??
    ref.presidentId ??
    ref.adjudicatorMemberId ??
    ref.adjudicatorCabinetId ??
    ref.adjudicatorPresidentId ??
    null
  );
}

export interface SubmitChairAdjudicatorScoreInput extends ChairScoringRequest {
  participantId: string;
}

function sameAdjudicatorScores(
  existing: Awaited<ReturnType<ChairScoringRepositoryContract["getExistingAdjudicatorScoreRecords"]>>,
  requested: ChairScoringRequest["adjudicatorScores"],
) {
  if (existing.length !== requested.length) {
    return false;
  }

  const requestedMap = new Map(requested.map((entry) => [entry.adjudicatorMemberId, entry]));
  return existing.every((entry) => {
    const participantId = resolveParticipantId(entry);
    const requestedEntry = participantId ? requestedMap.get(participantId) : undefined;
    return !!requestedEntry && requestedEntry.rating === entry.rating && (requestedEntry.notes ?? null) === (entry.notes ?? null);
  });
}

function sameSpeakerScores(
  existing: Awaited<ReturnType<ChairScoringRepositoryContract["getExistingSpeakerScoreRecords"]>>,
  requested: ChairScoringRequest["speakerScores"],
) {
  if (existing.length !== requested.length) {
    return false;
  }

  const requestedMap = new Map(requested.map((entry) => [entry.memberId, entry]));
  return existing.every((entry) => {
    const participantId = resolveParticipantId(entry);
    const requestedEntry = participantId ? requestedMap.get(participantId) : undefined;
    return (
      !!requestedEntry &&
      requestedEntry.rawScore === entry.rawScore &&
      requestedEntry.bpPosition === entry.bpPosition &&
      requestedEntry.speakingRole === entry.speakingRole &&
      requestedEntry.teamResultPoints === entry.teamResultPoints
    );
  });
}

export function createChairScoringService(
  repository: ChairScoringRepositoryContract = scoringRepository as ChairScoringRepositoryContract,
  publishEvent: typeof publishSessionRealtimeEvent = publishSessionRealtimeEvent,
) {
  async function submitChairAdjudicatorScore(input: SubmitChairAdjudicatorScoreInput): Promise<ScoreSubmissionResponse> {
    const context = await repository.getPublishedScoringContext(input.sessionId);
    if (!context) {
      throw new ChairScoringError("SESSION_NOT_FOUND", `Session ${input.sessionId} not found.`);
    }
    if (context.publicationStatus !== "PUBLISHED" || !context.proposalId) {
      throw new ChairScoringError("SCORING_NOT_OPEN", `Session ${input.sessionId} is not published for scoring.`);
    }

    const role = context.roles.find((entry) => entry.participantId === input.participantId);
    if (!role || role.role !== "adjudicator" || !role.isChair) {
      throw new ChairScoringError("SESSION_ROLE_REQUIRED", "Only the assigned session chair may submit the chair form.");
    }

    const room = context.rooms.find((entry) => entry.adjudicators.some((adjudicator) => adjudicator.participantId === input.participantId && adjudicator.isChair));
    if (!room) {
      throw new ChairScoringError("SESSION_ROLE_REQUIRED", "Chair is not assigned to a published room.");
    }

    const permittedAdjudicators = new Set(
      room.adjudicators.filter((adjudicator) => !adjudicator.isChair).map((adjudicator) => adjudicator.participantId),
    );
    const permittedSpeakers = new Set(room.speakers.map((speaker) => speaker.participantId));

    if (!input.adjudicatorScores.every((entry) => permittedAdjudicators.has(entry.adjudicatorMemberId))) {
      throw new ChairScoringError("SESSION_ROLE_REQUIRED", "Chair may only score adjudicators in their own room.");
    }
    if (!input.speakerScores.every((entry) => permittedSpeakers.has(entry.memberId))) {
      throw new ChairScoringError("SESSION_ROLE_REQUIRED", "Chair may only enter speaker scores for speakers in their own room.");
    }

    const participantTypes = await repository.getParticipantTypes([
      input.participantId,
      ...input.adjudicatorScores.map((entry) => entry.adjudicatorMemberId),
      ...input.speakerScores.map((entry) => entry.memberId),
    ]);
    const chairParticipantType = participantTypes.get(input.participantId) ?? "member";

    const existingAdjudicatorScores = await repository.getExistingAdjudicatorScoreRecords(input.sessionId, input.participantId);
    if (existingAdjudicatorScores.length > 0) {
      if (!sameAdjudicatorScores(existingAdjudicatorScores, input.adjudicatorScores)) {
        throw new ChairScoringError("SUBMISSION_CONFLICT", "Chair adjudicator scores already submitted with different values.");
      }
    } else if (input.adjudicatorScores.length > 0) {
      await repository.createAdjudicatorScoreRecords({
        sessionId: input.sessionId,
        proposalId: context.proposalId,
        chairParticipantId: input.participantId,
        chairParticipantType,
        adjudicatorScores: input.adjudicatorScores.map((entry) => ({
          participantId: entry.adjudicatorMemberId,
          participantType: participantTypes.get(entry.adjudicatorMemberId) ?? "member",
          rating: entry.rating,
          notes: entry.notes ?? null,
        })),
      });
    }

    const existingSpeakerScores = await repository.getExistingSpeakerScoreRecords(input.sessionId, input.participantId);
    if (existingSpeakerScores.length > 0) {
      if (!sameSpeakerScores(existingSpeakerScores, input.speakerScores)) {
        throw new ChairScoringError("SUBMISSION_CONFLICT", "Chair speaker scores already submitted with different values.");
      }
    } else if (input.speakerScores.length > 0) {
      await repository.createSpeakerScoreRecords(
        input.sessionId,
        context.proposalId,
        input.speakerScores.map((entry) => ({
          participantId: entry.memberId,
          participantType: participantTypes.get(entry.memberId) ?? "member",
          bpPosition: entry.bpPosition,
          speakingRole: entry.speakingRole,
          rawScore: entry.rawScore,
          teamResultPoints: entry.teamResultPoints,
          scoredByParticipantId: input.participantId,
          scoredByParticipantType: chairParticipantType,
        })),
      );
    }

    await updateLearnedMetricsFromSession(input.sessionId);
    await updatePairMetricSnapshotsFromSession(input.sessionId);
    await updateRolePerformanceFromSession(input.sessionId);

    await invalidateTags([CACHE_TAGS.leaderboard, CACHE_TAGS.progress]);

    await publishEvent(input.sessionId, {
      eventId: `scoring.submitted:${input.sessionId}:${input.participantId}:${Date.now()}`,
      eventType: "scoring.submitted",
      occurredAt: new Date().toISOString(),
      sessionId: input.sessionId,
      proposalId: context.proposalId,
      visibility: "SESSION_ROLE_ONLY",
      refetchHints: ["scoring_status"],
      entityVersion: context.proposalId,
      audienceParticipantIds: context.roles.map((entry) => entry.participantId),
    });

    return { sessionId: input.sessionId, accepted: true };
  }

  return {
    submitChairAdjudicatorScore,
  };
}

export const { submitChairAdjudicatorScore } = createChairScoringService();


