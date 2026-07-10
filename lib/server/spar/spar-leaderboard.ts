import type { SparAggregateRow } from "../repositories/spar-repository.ts";
import type { SparLeaderboardEntry, SparLeaderboardResponse } from "../../../types/spar.ts";

const NORMAL_SPAR_POINTS = 10;
const IRON_MAN_SPAR_POINTS = 15;
const STREAK_STEP = 0.1;
const MAX_STREAK_MULTIPLIER = 1.5;
const STREAK_GAP_MS = 7 * 24 * 60 * 60 * 1000;

interface RankedSparParticipant extends SparLeaderboardEntry {
  points: number;
}

function startOfUtcDay(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function uniqueSortedDays(sparDates: Date[]): number[] {
  return [...new Set(sparDates.map(startOfUtcDay))].sort((first, second) => first - second);
}

export function calculateCurrentSparStreak(sparDates: Date[]): number {
  const days = uniqueSortedDays(sparDates);
  if (days.length === 0) return 0;

  let streak = 1;
  for (let index = days.length - 1; index > 0; index -= 1) {
    if (days[index] - days[index - 1] > STREAK_GAP_MS) break;
    streak += 1;
  }
  return streak;
}

export function calculateSparLeaderboardPoints(row: SparAggregateRow): number {
  const sortedSpars = [...row.spars].sort((first, second) => first.sparDate.getTime() - second.sparDate.getTime());
  let previousDay: number | null = null;
  let streakWeek = 0;
  let points = 0;

  for (const spar of sortedSpars) {
    const currentDay = startOfUtcDay(spar.sparDate);
    if (previousDay === null || currentDay - previousDay > STREAK_GAP_MS) {
      streakWeek = 1;
    } else if (currentDay !== previousDay) {
      streakWeek += 1;
    }

    const multiplier = Math.min(1 + (streakWeek - 1) * STREAK_STEP, MAX_STREAK_MULTIPLIER);
    const basePoints = spar.isIronMan ? IRON_MAN_SPAR_POINTS : NORMAL_SPAR_POINTS;
    points += basePoints * multiplier;
    previousDay = currentDay;
  }

  return points;
}

export function buildSparLeaderboard(
  rows: SparAggregateRow[],
  viewerId: string,
  page: number,
  limit: number,
): SparLeaderboardResponse {
  const ranked: RankedSparParticipant[] = rows
    .filter((row) => row.totalSpars > 0)
    .map((row) => ({
      rank: 0,
      userId: row.participantId,
      userRole: row.participantRole,
      userName: row.participantName,
      totalSpars: row.totalSpars,
      currentStreak: calculateCurrentSparStreak(row.sparDates),
      points: calculateSparLeaderboardPoints(row),
    }))
    .sort((first, second) =>
      second.points - first.points
      || second.totalSpars - first.totalSpars
      || first.userName.localeCompare(second.userName),
    );

  let previousPoints: number | null = null;
  let previousRank = 0;
  const withRanks = ranked.map((entry, index) => {
    const rank = previousPoints === entry.points ? previousRank : index + 1;
    previousPoints = entry.points;
    previousRank = rank;
    return { ...entry, rank };
  });

  const totalParticipants = withRanks.length;
  const totalPages = Math.ceil(totalParticipants / limit);
  const start = (page - 1) * limit;
  const rankings = withRanks.slice(start, start + limit).map(({ points: _points, ...entry }) => entry);
  const viewerRank = withRanks.find((entry) => entry.userId === viewerId) ?? null;

  return {
    rankings,
    myRank: viewerRank
      ? {
          rank: viewerRank.rank,
          totalSpars: viewerRank.totalSpars,
          currentStreak: viewerRank.currentStreak,
        }
      : null,
    totalParticipants,
    pagination: { page, limit, totalPages },
  };
}