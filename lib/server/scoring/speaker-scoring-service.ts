import type { ScoreSubmissionResponse, SpeakerScoringRequest } from "../../../types/scoring.ts";
import { publishSessionRealtimeEvent } from "../realtime/event-publisher.ts";
import { scoringRepository } from "../repositories/scoring-repository.ts";

export class SpeakerScoringError extends Error {
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
    this.name = "SpeakerScoringError";
    this.code = code;
  }
}

type ParticipantType = "member" | "cabinet" | "president";

interface SpeakerScoringRepositoryContract {
  getPublishedScoringContext(sessionId: string): Promise<{
    proposalId: string | null;
    publicationStatus: string;
    roles: Array<{ participantId: string; role: string; isChair: boolean }>;
    rooms: Array<{
      speakers: Array<{ participantId: string }>;
      adjudicators: Array<{ participantId: string; isChair: boolean }>;
    }>;
  } | null>;
  getParticipantTypes(participantIds: string[]): Promise<Map<string, ParticipantType>>;
  getChairFeedbackBySpeaker(sessionId: string, speakerParticipantId: string): Promise<{
    chairMemberId: string | null;
    chairCabinetId: string | null;
    chairPresidentId: string | null;
    rating: number;
    notes: string | null;
  } | null>;
  createChairFeedbackRecord(input: {
    sessionId: string;
    proposalId: string;
    speakerParticipantId: string;
    speakerParticipantType: ParticipantType;
    chairParticipantId: string;
    chairParticipantType: ParticipantType;
    rating: number;
    notes?: string | null;
  }): Promise<{ id: string }>;
  getExistingTeamDynamicsRatings(sessionId: string, raterParticipantId: string): Promise<Array<{
    teammateMemberId: string | null;
    teammateCabinetId: string | null;
    teammatePresidentId: string | null;
    rating: number;
  }>>;
  createTeamDynamicsRatings(input: {
    sessionId: string;
    raterParticipantId: string;
    raterParticipantType: ParticipantType;
    teammateParticipantIds: string[];
    teammateParticipantTypesById: Map<string, ParticipantType>;
    rating: number;
  }): Promise<{ count: number }>;
}

function resolveParticipantId(ref: {
  chairMemberId?: string | null;
  chairCabinetId?: string | null;
  chairPresidentId?: string | null;
  teammateMemberId?: string | null;
  teammateCabinetId?: string | null;
  teammatePresidentId?: string | null;
}) {
  return (
    ref.chairMemberId ??
    ref.chairCabinetId ??
    ref.chairPresidentId ??
    ref.teammateMemberId ??
    ref.teammateCabinetId ??
    ref.teammatePresidentId ??
    null
  );
}

export interface SubmitSpeakerScoreInput extends SpeakerScoringRequest {
  participantId: string;
}

export function createSpeakerScoringService(
  repository: SpeakerScoringRepositoryContract = scoringRepository as SpeakerScoringRepositoryContract,
  publishEvent: typeof publishSessionRealtimeEvent = publishSessionRealtimeEvent,
) {
  async function submitSpeakerScore(input: SubmitSpeakerScoreInput): Promise<ScoreSubmissionResponse> {
    return submitSpeakerChairRating(input);
  }

  async function submitSpeakerChairRating(input: SubmitSpeakerScoreInput): Promise<ScoreSubmissionResponse> {
    const context = await repository.getPublishedScoringContext(input.sessionId);
    if (!context) {
      throw new SpeakerScoringError("SESSION_NOT_FOUND", `Session ${input.sessionId} not found.`);
    }
    if (context.publicationStatus !== "PUBLISHED" || !context.proposalId) {
      throw new SpeakerScoringError("SCORING_NOT_OPEN", `Session ${input.sessionId} is not published for scoring.`);
    }

    const role = context.roles.find((entry) => entry.participantId === input.participantId);
    if (!role || role.role !== "speaker") {
      throw new SpeakerScoringError("SESSION_ROLE_REQUIRED", "Only session speakers may submit the speaker form.");
    }

    const room = context.rooms.find((entry) => entry.speakers.some((speaker) => speaker.participantId === input.participantId));
    const chairParticipantId = room?.adjudicators.find((adjudicator) => adjudicator.isChair)?.participantId;
    if (!room || !chairParticipantId) {
      throw new SpeakerScoringError("SESSION_ROLE_REQUIRED", "Speaker is not assigned to a chaired published room.");
    }

    const participantTypes = await repository.getParticipantTypes([input.participantId, chairParticipantId, ...room.speakers.map((speaker) => speaker.participantId)]);
    const speakerParticipantType = participantTypes.get(input.participantId) ?? "member";
    const chairParticipantType = participantTypes.get(chairParticipantId) ?? "member";

    const existingChairFeedback = await repository.getChairFeedbackBySpeaker(input.sessionId, input.participantId);
    if (existingChairFeedback) {
      const existingChairId = resolveParticipantId(existingChairFeedback);
      if (
        existingChairId === chairParticipantId &&
        existingChairFeedback.rating === input.chairScore &&
        (existingChairFeedback.notes ?? null) === (input.notes ?? null)
      ) {
        return { sessionId: input.sessionId, accepted: true };
      }
      throw new SpeakerScoringError("SUBMISSION_CONFLICT", "Speaker form already submitted with different values.");
    }

    await repository.createChairFeedbackRecord({
      sessionId: input.sessionId,
      proposalId: context.proposalId,
      speakerParticipantId: input.participantId,
      speakerParticipantType,
      chairParticipantId,
      chairParticipantType,
      rating: input.chairScore,
      notes: input.notes ?? null,
    });

    if (input.teamDynamicsRating != null) {
      const teammateParticipantIds = room.speakers
        .map((speaker) => speaker.participantId)
        .filter((participantId) => participantId !== input.participantId);
      const existingTeamDynamics = await repository.getExistingTeamDynamicsRatings(input.sessionId, input.participantId);
      const matchingExisting = existingTeamDynamics.every((entry) => entry.rating === input.teamDynamicsRating);
      if (existingTeamDynamics.length === teammateParticipantIds.length && matchingExisting) {
        return { sessionId: input.sessionId, accepted: true };
      }
      if (existingTeamDynamics.length > 0) {
        throw new SpeakerScoringError("SUBMISSION_CONFLICT", "Team dynamics rating already submitted with different values.");
      }

      await repository.createTeamDynamicsRatings({
        sessionId: input.sessionId,
        raterParticipantId: input.participantId,
        raterParticipantType: speakerParticipantType,
        teammateParticipantIds,
        teammateParticipantTypesById: participantTypes,
        rating: input.teamDynamicsRating,
      });
    }

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
    submitSpeakerScore,
    submitSpeakerChairRating,
  };
}

export const { submitSpeakerScore, submitSpeakerChairRating } = createSpeakerScoringService();
