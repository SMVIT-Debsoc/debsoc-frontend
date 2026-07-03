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
  publishedPairing: (sessionId: string) => k("published", sessionId),
  selfAttendance: (role: string, userId: string) => k("attendance", "self", role, userId),
} as const;
