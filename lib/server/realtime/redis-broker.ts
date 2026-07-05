import { getRedis, getRedisSubscriber, isRedisConfigured } from "../cache/redis.ts";
import type { RealtimeEventEnvelope } from "../../../types/realtime.ts";

const REALTIME_CHANNEL = "pairing:realtime:v1";

type RealtimeBrokerListener = (event: RealtimeEventEnvelope) => void;

const listeners = new Set<RealtimeBrokerListener>();
let subscriptionStarted = false;

// Cross-instance realtime fan-out via Redis pub/sub. This opens a SECOND,
// dedicated Redis connection (Redis requires a separate connection for
// subscriptions). It is only needed when the app runs as MULTIPLE instances —
// with the single custom server (server.ts) the in-memory hub already delivers
// every event to every connected client, so the subscriber is pure overhead.
//
// On a connection-capped free-tier Redis, that wasted connection is exactly
// what pushes the instance to "max number of clients reached". So fan-out is
// OFF by default and must be explicitly enabled (set REALTIME_REDIS_FANOUT=true)
// only when you actually run more than one app instance behind the same Redis.
function isRealtimeFanoutEnabled() {
  return isRedisConfigured() && process.env.REALTIME_REDIS_FANOUT === "true";
}

function startSubscription() {
  if (subscriptionStarted || !isRealtimeFanoutEnabled()) {
    return;
  }

  const subscriber = getRedisSubscriber();
  if (!subscriber) {
    return;
  }

  subscriptionStarted = true;

  subscriber.subscribe(REALTIME_CHANNEL).catch(() => {
    subscriptionStarted = false;
  });

  subscriber.on("message", (channel, message) => {
    if (channel !== REALTIME_CHANNEL) {
      return;
    }

    try {
      const parsed = JSON.parse(message) as RealtimeEventEnvelope;
      for (const listener of listeners) {
        listener(parsed);
      }
    } catch {
      // Ignore malformed broker payloads.
    }
  });
}

export function hasRedisRealtimeBroker() {
  if (!isRealtimeFanoutEnabled()) {
    return false;
  }
  startSubscription();
  return Boolean(getRedis()) && Boolean(getRedisSubscriber());
}

export async function publishRealtimeBrokerEvent(event: RealtimeEventEnvelope) {
  if (!hasRedisRealtimeBroker()) {
    return false;
  }

  const redis = getRedis();
  if (!redis) {
    return false;
  }

  try {
    await redis.publish(REALTIME_CHANNEL, JSON.stringify(event));
    return true;
  } catch (error) {
    console.error("Realtime broker publish failed", error);
    return false;
  }
}

export function subscribeToRealtimeBroker(listener: RealtimeBrokerListener) {
  if (!hasRedisRealtimeBroker()) {
    return () => {};
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
