// Two-layer cache: L1 (in-process memory) + L2 (Redis), fronting the database.
//
// Read path (getOrLoad):
//   L1 hit -> return
//   L2 hit -> populate L1 -> return
//   miss   -> run loader (DB) -> populate L2 -> populate L1 -> return
//
// Redis is never on the failure path: every Redis call is time-boxed and
// wrapped, and a circuit breaker stops calling a dead Redis for a cooldown
// window. If Redis is unavailable the cache degrades to L1-only, then DB.

import { getRedis, getRedisSubscriber, isRedisConfigured } from "./redis";
import { l1Get, l1Set, l1InvalidateTags } from "./l1";
import { CACHE_INVALIDATION_CHANNEL, type CacheTag } from "./keys";

// --- Tunables -------------------------------------------------------------
const DEFAULT_L1_TTL_MS = 10_000; // short: absorbs bursts on one instance
const DEFAULT_L2_TTL_MS = 120_000; // longer: shared across instances
const REDIS_OP_TIMEOUT_MS = 1000; // generous for a remote instance, still bounded
const MAX_L2_VALUE_BYTES = 1_000_000; // don't let one big key dominate 30 MB

// Circuit breaker: after this many consecutive failures, skip Redis entirely
// for the cooldown period so a dead Redis adds no latency to requests.
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 15_000;

// --- Observability --------------------------------------------------------
export const cacheStats = {
  l1Hits: 0,
  l2Hits: 0,
  misses: 0,
  redisErrors: 0,
};

// --- Circuit breaker state ------------------------------------------------
let consecutiveFailures = 0;
let breakerOpenUntil = 0;

function breakerIsOpen(): boolean {
  return Date.now() < breakerOpenUntil;
}

function recordRedisSuccess(): void {
  consecutiveFailures = 0;
}

function recordRedisFailure(): void {
  cacheStats.redisErrors += 1;
  consecutiveFailures += 1;
  if (consecutiveFailures >= BREAKER_THRESHOLD) {
    breakerOpenUntil = Date.now() + BREAKER_COOLDOWN_MS;
    consecutiveFailures = 0;
  }
}

// Time-box any Redis operation; treat a timeout as a failure.
async function withTimeout<T>(op: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("redis-timeout")), REDIS_OP_TIMEOUT_MS);
  });
  try {
    return await Promise.race([op, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

function redisTagSetKey(tag: string): string {
  return `tagset:${tag}`;
}

export type GetOrLoadOptions = {
  tags: CacheTag[];
  l1TtlMs?: number;
  l2TtlMs?: number;
};

export async function getOrLoad<T>(
  key: string,
  options: GetOrLoadOptions,
  loader: () => Promise<T>,
): Promise<T> {
  const l1Ttl = options.l1TtlMs ?? DEFAULT_L1_TTL_MS;
  const l2Ttl = options.l2TtlMs ?? DEFAULT_L2_TTL_MS;

  // L1
  const fromL1 = l1Get<T>(key);
  if (fromL1 !== undefined) {
    cacheStats.l1Hits += 1;
    return fromL1;
  }

  // L2 (best effort)
  const redis = getRedis();
  if (redis && !breakerIsOpen()) {
    try {
      const raw = await withTimeout(redis.get(key));
      recordRedisSuccess();
      if (raw !== null) {
        cacheStats.l2Hits += 1;
        const value = JSON.parse(raw) as T;
        l1Set(key, value, l1Ttl, options.tags);
        return value;
      }
    } catch {
      recordRedisFailure();
      // fall through to loader
    }
  }

  // Miss -> source of truth. Single-flight: if another request for the same key
  // is already loading, wait for it instead of issuing a duplicate DB query.
  // This prevents a cache stampede when a hot key expires while many clients
  // (e.g. 30s dashboard polling) hit it at once.
  const inFlight = inFlightLoads.get(key);
  if (inFlight) {
    return (await inFlight) as T;
  }

  cacheStats.misses += 1;
  const loadPromise = (async () => {
    const value = await loader();
    // Populate L1 always; L2 best-effort.
    l1Set(key, value, l1Ttl, options.tags);
    void writeToL2(key, value, l2Ttl, options.tags);
    return value;
  })();
  inFlightLoads.set(key, loadPromise);
  try {
    return (await loadPromise) as T;
  } finally {
    inFlightLoads.delete(key);
  }
}

// Coalesces concurrent cache-miss loads for the same key within this process.
const inFlightLoads = new Map<string, Promise<unknown>>();

async function writeToL2(
  key: string,
  value: unknown,
  l2Ttl: number,
  tags: CacheTag[],
): Promise<void> {
  const redis = getRedis();
  if (!redis || breakerIsOpen()) return;
  try {
    const serialized = JSON.stringify(value);
    if (Buffer.byteLength(serialized, "utf8") > MAX_L2_VALUE_BYTES) {
      // Oversized: keep it L1-only so one key can't dominate a small instance.
      return;
    }
    const pipeline = redis.pipeline();
    pipeline.set(key, serialized, "PX", l2Ttl);
    for (const tag of tags) {
      pipeline.sadd(redisTagSetKey(tag), key);
      // Tag sets outlive individual keys slightly so invalidation stays cheap.
      pipeline.pexpire(redisTagSetKey(tag), l2Ttl * 2);
    }
    await withTimeout(pipeline.exec());
    recordRedisSuccess();
  } catch {
    recordRedisFailure();
  }
}

// Invalidate every key carrying any of the given tags. Drops L1 locally,
// clears L2, and broadcasts so other instances drop their L1 too.
export async function invalidateTags(tags: CacheTag[]): Promise<void> {
  if (tags.length === 0) return;

  // Local L1 first (synchronous, always works).
  l1InvalidateTags(tags);

  const redis = getRedis();
  if (!redis || breakerIsOpen()) return;

  try {
    const pipeline = redis.pipeline();
    for (const tag of tags) {
      const tagKey = redisTagSetKey(tag);
      const members = await withTimeout(redis.smembers(tagKey));
      if (members.length > 0) pipeline.del(...members);
      pipeline.del(tagKey);
    }
    await withTimeout(pipeline.exec());
    // Tell other instances to drop their L1 entries for these tags.
    await withTimeout(redis.publish(CACHE_INVALIDATION_CHANNEL, JSON.stringify(tags)));
    recordRedisSuccess();
  } catch {
    recordRedisFailure();
  }
}

// --- Cross-instance L1 coherence -----------------------------------------
// Subscribe once per process. When any instance invalidates tags, every other
// instance drops matching L1 entries so no stale value outlives its source.
let subscriptionStarted = false;

export function ensureInvalidationSubscription(): void {
  if (subscriptionStarted || !isRedisConfigured()) return;
  const subscriber = getRedisSubscriber();
  if (!subscriber) return;
  subscriptionStarted = true;

  subscriber.subscribe(CACHE_INVALIDATION_CHANNEL).catch(() => {
    subscriptionStarted = false;
  });
  subscriber.on("message", (channel, message) => {
    if (channel !== CACHE_INVALIDATION_CHANNEL) return;
    try {
      const tags = JSON.parse(message) as CacheTag[];
      l1InvalidateTags(tags);
    } catch {
      // ignore malformed messages
    }
  });
}

// Start the subscription eagerly on module load (no-op without Redis).
ensureInvalidationSubscription();
