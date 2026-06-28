import { realtimeSubscriptionScopes } from "../../../types/realtime.ts";
import { canConnectToRealtime, canSubscribeToRealtimeScope, filterRealtimeEventForSubscriber } from "./channel-auth.ts";
import type { AcceptRealtimeConnectionInput, RealtimeConnectionHandle, RealtimeConnectionRecord, RealtimePublishResult } from "./types.ts";
import type { RealtimeEventEnvelope, RealtimeSubscription } from "../../../types/realtime.ts";

const connections = new Map<string, RealtimeConnectionRecord>();

export class RealtimeConnectionError extends Error {
  code: "CONNECTION_FORBIDDEN" | "SUBSCRIPTION_FORBIDDEN";

  constructor(code: "CONNECTION_FORBIDDEN" | "SUBSCRIPTION_FORBIDDEN", message: string) {
    super(message);
    this.name = "RealtimeConnectionError";
    this.code = code;
  }
}

function buildConnectionId() {
  return `rt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function subscriptionKey(subscription: RealtimeSubscription) {
  return `${subscription.scope}:${subscription.sessionId ?? "global"}`;
}

function validateSubscription(record: RealtimeConnectionRecord, subscription: RealtimeSubscription) {
  const sessionParticipantIds = subscription.sessionId
    ? record.sessionParticipantIdsBySessionId.get(subscription.sessionId) ?? []
    : [];

  if (!canSubscribeToRealtimeScope({
    user: record.user,
    subscription,
    sessionParticipantIds,
  })) {
    throw new RealtimeConnectionError(
      "SUBSCRIPTION_FORBIDDEN",
      `Subscription ${subscription.scope} is not allowed for user ${record.user.id}.`,
    );
  }
}

function addSubscription(record: RealtimeConnectionRecord, subscription: RealtimeSubscription) {
  validateSubscription(record, subscription);
  if (!record.subscriptions.some((entry) => subscriptionKey(entry) === subscriptionKey(subscription))) {
    record.subscriptions.push(subscription);
  }
}

export function acceptRealtimeConnection(input: AcceptRealtimeConnectionInput): RealtimeConnectionHandle {
  if (!canConnectToRealtime(input.user)) {
    throw new RealtimeConnectionError(
      "CONNECTION_FORBIDDEN",
      `Realtime connection is not allowed for role ${input.user.role}.`,
    );
  }

  const record: RealtimeConnectionRecord = {
    connectionId: input.connectionId ?? buildConnectionId(),
    user: input.user,
    subscriptions: [],
    bufferedEvents: [],
    sessionParticipantIdsBySessionId: input.sessionParticipantIdsBySessionId ?? new Map(),
    onEvent: input.onEvent,
  };

  for (const subscription of input.subscriptions ?? []) {
    addSubscription(record, subscription);
  }

  connections.set(record.connectionId, record);

  return {
    connectionId: record.connectionId,
    allowedScopes: [...realtimeSubscriptionScopes],
    transport: "WEBSOCKET_SUPPLEMENTAL",
    reconnectStrategy: "AUTHENTICATED_RESUBSCRIBE_THEN_HTTP_REFETCH",
    subscribe(subscription) {
      addSubscription(record, subscription);
    },
    unsubscribe(subscription) {
      record.subscriptions = record.subscriptions.filter((entry) => subscriptionKey(entry) !== subscriptionKey(subscription));
    },
    takeEvents() {
      const events = [...record.bufferedEvents];
      record.bufferedEvents.length = 0;
      return events;
    },
    close() {
      connections.delete(record.connectionId);
    },
  };
}

export function broadcastRealtimeEvent(event: RealtimeEventEnvelope): RealtimePublishResult {
  let deliveredCount = 0;
  let droppedCount = 0;

  for (const record of connections.values()) {
    const filteredEvent = filterRealtimeEventForSubscriber({
      subscriber: {
        user: record.user,
        subscriptions: record.subscriptions,
      },
      event,
    });

    if (!filteredEvent) {
      continue;
    }

    try {
      if (record.onEvent) {
        record.onEvent(filteredEvent);
      } else {
        record.bufferedEvents.push(filteredEvent);
      }
      deliveredCount += 1;
    } catch (error) {
      droppedCount += 1;
      console.error("Realtime fan-out failed", error);
    }
  }

  return {
    deliveredCount,
    droppedCount,
    activeConnectionCount: connections.size,
  };
}
