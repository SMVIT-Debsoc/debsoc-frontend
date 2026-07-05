// L2 cache transport: a single shared Redis client.
//
// Redis is a best-effort accelerator here, never a hard dependency. If
// REDIS_URL is unset, or the connection fails, the cache layer silently
// degrades to L1-only (and ultimately the database). Nothing in the request
// path should ever throw because of Redis.

import { createRequire } from "node:module";

const globalForRedis = globalThis as typeof globalThis & {
  redisClient?: RedisClient | null;
  redisSubscriber?: RedisClient | null;
};

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: "PX", ttl: number): Promise<unknown>;
  sadd(key: string, value: string): Promise<unknown>;
  pexpire(key: string, ttl: number): Promise<unknown>;
  smembers(key: string): Promise<string[]>;
  del(...keys: string[]): Promise<unknown>;
  publish(channel: string, message: string): Promise<unknown>;
  subscribe(channel: string): Promise<unknown>;
  ping(): Promise<string>;
  pipeline(): {
    set(key: string, value: string, mode: "PX", ttl: number): unknown;
    sadd(key: string, value: string): unknown;
    pexpire(key: string, ttl: number): unknown;
    del(...keys: string[]): unknown;
    exec(): Promise<unknown>;
  };
  on(event: "error" | "message", listener: (...args: string[]) => void): void;
};

const require = createRequire(import.meta.url);

function buildClient(role: "cmd" | "sub" = "cmd"): RedisClient | null {
  // Hosted free-tier Redis (e.g. redis.io) caps total client connections
  // (~30). This process opens at most one command client and one subscriber;
  // both are process-global singletons (see getRedis/getRedisSubscriber) so
  // HMR reloads and repeated imports reuse them instead of leaking new sockets.
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (process.env.CACHE_ENABLED === "false") return null;

  // A malformed REDIS_URL makes `new Redis()` throw synchronously. Since this
  // runs at module load, an unguarded throw would crash every route that
  // imports the cache. Treat any construction failure as "no Redis" and degrade
  // to L1-only — Redis must never be able to take the app down.
  try {
    const Redis = require("ioredis").default ?? require("ioredis");
    const client = new Redis(url, {
      // Name the connection so it is identifiable in `CLIENT LIST` when
      // diagnosing "max number of clients reached" on the capped instance.
      connectionName: `debsoc-${role}-${process.pid}`,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      // Queue commands issued before the connection is ready instead of failing
      // them outright. Every cache op is separately time-boxed (see cache.ts),
      // so a queued command that never resolves still falls back to the DB — we
      // get the benefit of Redis without letting a slow connect break requests.
      enableOfflineQueue: true,
      // Generous connect timeout: this is a remote (WAN) instance, so a 1s
      // budget would spuriously fail the initial handshake.
      connectTimeout: 10000,
      // Keep reconnecting in the background, but with backoff, so a brief Redis
      // outage self-heals without hammering a free-tier instance.
      retryStrategy: (times: number) => Math.min(times * 200, 5000),
    });

    // Swallow connection errors — the circuit breaker in cache.ts handles
    // fallback. Without this listener ioredis would emit unhandled error events.
    client.on("error", (err: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[cache] Redis error:", err instanceof Error ? err.message : err);
      }
    });

    return client;
  } catch (err) {
    console.warn(
      "[cache] Invalid REDIS_URL, falling back to in-memory cache only:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

export function getRedis(): RedisClient | null {
  if (globalForRedis.redisClient === undefined) {
    globalForRedis.redisClient = buildClient();
  }
  return globalForRedis.redisClient ?? null;
}

// A second connection dedicated to pub/sub. Redis requires a separate
// connection for subscriptions since a subscribed client cannot run normal
// commands. Returns null when caching is disabled.
export function getRedisSubscriber(): RedisClient | null {
  if (globalForRedis.redisSubscriber === undefined) {
    globalForRedis.redisSubscriber = buildClient("sub");
  }
  return globalForRedis.redisSubscriber ?? null;
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim()) && process.env.CACHE_ENABLED !== "false";
}
