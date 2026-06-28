import type {
  AdjudicatorLeaderboardResponse,
  ParticipantProgressProfile,
  ParticipantProgressSummary,
  SpeakerLeaderboardResponse,
} from "../../../types/scoring.ts";
import { publishRealtimeEvent } from "../realtime/event-publisher.ts";
import { scoringRepository } from "../repositories/scoring-repository.ts";

interface LeaderboardRepositoryContract {
  getSpeakerLeaderboardRawData(): Promise<SpeakerLeaderboardResponse["leaderboard"]>;
  getAdjudicatorLeaderboardRawData(): Promise<AdjudicatorLeaderboardResponse["leaderboard"]>;
  getAllParticipantProgressSummaries?(): Promise<ParticipantProgressSummary[]>;
  getParticipantProgressProfile?(participantId: string): Promise<ParticipantProgressProfile>;
  getParticipantProgressSummary?(participantId: string): Promise<ParticipantProgressSummary>;
}

export function createLeaderboardService(
  repository: LeaderboardRepositoryContract = scoringRepository as LeaderboardRepositoryContract,
  publishEvent: typeof publishRealtimeEvent = publishRealtimeEvent,
) {
  async function recomputeSpeakerLeaderboard(): Promise<SpeakerLeaderboardResponse> {
    const leaderboard = await repository.getSpeakerLeaderboardRawData();
    await publishEvent({
      eventId: `leaderboard.updated:speakers:${Date.now()}`,
      eventType: "leaderboard.updated",
      occurredAt: new Date().toISOString(),
      sessionId: null,
      proposalId: null,
      visibility: "MEMBER_SAFE",
      refetchHints: ["leaderboard"],
      entityVersion: `${leaderboard.length}`,
    });
    return { leaderboard };
  }

  async function recomputeAdjudicatorLeaderboard(): Promise<AdjudicatorLeaderboardResponse> {
    const leaderboard = await repository.getAdjudicatorLeaderboardRawData();
    await publishEvent({
      eventId: `leaderboard.updated:adjudicators:${Date.now()}`,
      eventType: "leaderboard.updated",
      occurredAt: new Date().toISOString(),
      sessionId: null,
      proposalId: null,
      visibility: "MEMBER_SAFE",
      refetchHints: ["leaderboard"],
      entityVersion: `${leaderboard.length}`,
    });
    return { leaderboard };
  }

  async function recomputeChairDerivedStats(): Promise<AdjudicatorLeaderboardResponse> {
    return recomputeAdjudicatorLeaderboard();
  }

  async function getParticipantProgressSummaries(): Promise<{ participants: ParticipantProgressSummary[] }> {
    const participants = await repository.getAllParticipantProgressSummaries?.() ?? [];
    return { participants };
  }

  async function getParticipantProgressProfile(participantId: string): Promise<ParticipantProgressProfile> {
    if (!repository.getParticipantProgressProfile) throw new Error("Progress profile read is unavailable.");
    return repository.getParticipantProgressProfile(participantId);
  }

  async function getParticipantProgressSummary(participantId: string): Promise<ParticipantProgressSummary> {
    if (!repository.getParticipantProgressSummary) throw new Error("Progress summary read is unavailable.");
    return repository.getParticipantProgressSummary(participantId);
  }

  return {
    recomputeSpeakerLeaderboard,
    recomputeAdjudicatorLeaderboard,
    recomputeChairDerivedStats,
    getParticipantProgressSummaries,
    getParticipantProgressProfile,
    getParticipantProgressSummary,
  };
}

export const {
  recomputeSpeakerLeaderboard,
  recomputeAdjudicatorLeaderboard,
  recomputeChairDerivedStats,
  getParticipantProgressSummaries,
  getParticipantProgressProfile,
  getParticipantProgressSummary,
} = createLeaderboardService();

