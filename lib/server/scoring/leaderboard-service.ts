import type {
  AdjudicatorLeaderboardResponse,
  ParticipantProgressProfile,
  ParticipantProgressSummary,
  SpeakerLeaderboardResponse,
} from "../../../types/scoring.ts";
import { scoringRepository } from "../repositories/scoring-repository.ts";
import { getOrLoad } from "../cache/cache.ts";
import { cacheKeys, CACHE_TAGS } from "../cache/keys.ts";

interface LeaderboardRepositoryContract {
  getSpeakerLeaderboardRawData(): Promise<SpeakerLeaderboardResponse["leaderboard"]>;
  getAdjudicatorLeaderboardRawData(): Promise<AdjudicatorLeaderboardResponse["leaderboard"]>;
  getAllParticipantProgressSummaries?(): Promise<ParticipantProgressSummary[]>;
  getParticipantProgressProfile?(participantId: string): Promise<ParticipantProgressProfile>;
  getParticipantProgressSummary?(participantId: string): Promise<ParticipantProgressSummary>;
}

export function createLeaderboardService(
  repository: LeaderboardRepositoryContract = scoringRepository as LeaderboardRepositoryContract,
) {
  async function recomputeSpeakerLeaderboard(): Promise<SpeakerLeaderboardResponse> {
    const leaderboard = await repository.getSpeakerLeaderboardRawData();
    return { leaderboard };
  }

  async function recomputeAdjudicatorLeaderboard(): Promise<AdjudicatorLeaderboardResponse> {
    const leaderboard = await repository.getAdjudicatorLeaderboardRawData();
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

const service = createLeaderboardService();

// Cache the hot dashboard reads. The pure factory above stays uncached so
// tests can inject fakes without cross-test cache bleed; caching is applied
// only to the shared singleton used by the API routes.
export const recomputeSpeakerLeaderboard: typeof service.recomputeSpeakerLeaderboard = () =>
  getOrLoad(
    cacheKeys.speakerLeaderboard("all"),
    { tags: [CACHE_TAGS.leaderboard] },
    () => service.recomputeSpeakerLeaderboard(),
  );

export const recomputeAdjudicatorLeaderboard: typeof service.recomputeAdjudicatorLeaderboard = () =>
  getOrLoad(
    cacheKeys.adjudicatorLeaderboard("all"),
    { tags: [CACHE_TAGS.leaderboard] },
    () => service.recomputeAdjudicatorLeaderboard(),
  );

export const getParticipantProgressSummaries: typeof service.getParticipantProgressSummaries = () =>
  getOrLoad(
    cacheKeys.progressSummaries(),
    { tags: [CACHE_TAGS.progress] },
    () => service.getParticipantProgressSummaries(),
  );

export const {
  recomputeChairDerivedStats,
  getParticipantProgressProfile,
  getParticipantProgressSummary,
} = service;

