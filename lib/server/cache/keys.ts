// Central registry of cache keys and tags.
//
// Keys are namespaced and versioned so a shape change can be rolled out by
// bumping the version without colliding with stale entries. Tags group keys
// for invalidation: a write service invalidates a tag, dropping every key
// carrying it.

const VERSION = "v1";

export const CACHE_TAGS = {
  leaderboard: "leaderboard",
  progress: "progress",
  sessions: "sessions",
  roster: "roster",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// TTL presets tuned to each dataset's volatility. L1 (in-process) is always
// short to bound staleness within a single instance; L2 (Redis) can live
// longer for data that changes rarely and is always invalidated on write.
export const CACHE_TTL = {
  // Leaderboards change only when scoring is submitted/completed (which
  // invalidates them), so they can live long in Redis.
  leaderboard: { l1TtlMs: 15_000, l2TtlMs: 300_000 },
  // Progress mirrors leaderboard volatility.
  progress: { l1TtlMs: 15_000, l2TtlMs: 300_000 },
  // Bootstrap roster+sessions changes on many admin actions but all invalidate.
  bootstrap: { l1TtlMs: 10_000, l2TtlMs: 120_000 },
  // Published pairing only changes on (re)publish — rarely — so cache it hard.
  published: { l1TtlMs: 30_000, l2TtlMs: 600_000 },
  // Per-user attendance: modest, invalidated by attendance/publish/lifecycle.
  attendance: { l1TtlMs: 10_000, l2TtlMs: 120_000 },
} as const;

// Redis pub/sub channel used to broadcast tag invalidations so every process
// drops its L1 entries and stays coherent across instances.
export const CACHE_INVALIDATION_CHANNEL = `cache:invalidate:${VERSION}`;

function k(...parts: string[]): string {
  return [VERSION, ...parts].join(":");
}

export const cacheKeys = {
  speakerLeaderboard: (scope: string) => k("lb", "speakers", scope),
  adjudicatorLeaderboard: (scope: string) => k("lb", "adjudicators", scope),
  bootstrap: () => k("bootstrap"),
  progressSummaries: () => k("progress", "members"),
  progressProfile: (participantId: string) => k("progress", "member", participantId),
  publishedPairing: (sessionId: string) => k("published", sessionId),
  selfAttendance: (role: string, userId: string) => k("attendance", "self", role, userId),
  verifiedUsers: () => k("roster", "verified"),
  unverifiedUsers: () => k("roster", "unverified"),
} as const;
