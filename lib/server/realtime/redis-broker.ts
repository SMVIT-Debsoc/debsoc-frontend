import { getRedis, getRedisSubscriber, isRedisConfigured } from "../cache/redis.ts";
import type { RealtimeEventEnvelope } from "../../../types/realtime.ts";

const REALTIME_CHANNEL = "pairing:realtime:v1";

type RealtimeBrokerListener = (event: RealtimeEventEnvelope) => void;

const listeners = new Set<RealtimeBrokerListener>();
let subscriptionStarted = false;

function startSubscription() {
  if (subscriptionStarted || !isRedisConfigured()) {
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
  startSubscription();
  return isRedisConfigured() && Boolean(getRedis()) && Boolean(getRedisSubscriber());
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
