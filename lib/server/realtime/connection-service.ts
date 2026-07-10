import { scoringRepository } from "../repositories/scoring-repository.ts";
import { filterRealtimeEventForSubscriber } from "./channel-auth.ts";
import { hasRedisRealtimeBroker, subscribeToRealtimeBroker } from "./redis-broker.ts";
import { acceptRealtimeConnection } from "./websocket-hub.ts";
import type { SessionUser } from "../roles.ts";
import type { RealtimeEventEnvelope, RealtimeSubscription, RealtimeSubscriptionScope } from "../../../types/realtime.ts";

const SSE_HEADERS = {
  "Cache-Control": "no-store, no-transform",
  Connection: "keep-alive",
  "Content-Type": "text/event-stream; charset=utf-8",
  "X-Accel-Buffering": "no",
} as const;

const HEARTBEAT_INTERVAL_MS = 20_000;

interface RealtimeScoringRepositoryContract {
  getPublishedScoringParticipantIds(sessionId: string): Promise<string[]>;
}

// Admin session roles are authorized for SESSION_SCORING regardless of the
// published participant set (see canSubscribeToRealtimeScope), so we never need
// the participant-ID lookup for them — skip it to keep the connect path fast.
function isRealtimeAdminRole(role: SessionUser["role"]) {
  return role === "cabinet" || role === "President" || role === "TechHead";
}

function parseSubscriptionToken(token: string): RealtimeSubscription | null {
  const value = token.trim();
  if (!value) {
    return null;
  }

  const [scopeToken, sessionId] = value.split(":");
  const scope = scopeToken?.trim() as RealtimeSubscriptionScope | undefined;
  if (!scope) {
    return null;
  }

  if (scope === "LEADERBOARD" || scope === "DASHBOARD") {
    return { scope };
  }

  if (!sessionId?.trim()) {
    return null;
  }

  return {
    scope,
    sessionId: sessionId.trim(),
  };
}

export function parseRealtimeSubscriptions(searchParams: URLSearchParams): RealtimeSubscription[] {
  const parsed = searchParams
    .getAll("subscription")
    .map(parseSubscriptionToken)
    .filter((entry): entry is RealtimeSubscription => entry !== null);

  const deduped = new Map<string, RealtimeSubscription>();
  for (const subscription of parsed) {
    deduped.set(`${subscription.scope}:${subscription.sessionId ?? "global"}`, subscription);
  }

  return [...deduped.values()];
}

async function buildSessionParticipantIdsBySessionId(
  user: SessionUser,
  subscriptions: RealtimeSubscription[],
  repository: RealtimeScoringRepositoryContract,
) {
  const participantIdsBySessionId = new Map<string, string[]>();

  // Admins are authorized for SESSION_SCORING without the participant lookup,
  // so the (DB-backed) query stays off their connect path entirely.
  if (isRealtimeAdminRole(user.role)) {
    return participantIdsBySessionId;
  }

  const scoringSessionIds = [...new Set(
    subscriptions
      .filter((subscription) => subscription.scope === "SESSION_SCORING")
      .map((subscription) => subscription.sessionId)
      .filter((sessionId): sessionId is string => Boolean(sessionId)),
  )];

  await Promise.all(
    scoringSessionIds.map(async (sessionId) => {
      const participantIds = await repository.getPublishedScoringParticipantIds(sessionId);
      participantIdsBySessionId.set(sessionId, participantIds);
    }),
  );

  return participantIdsBySessionId;
}

function writeSseEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: string, data: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${event}\n`));
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function getRealtimeConnectionBootstrap(
  user: SessionUser,
  requestUrl: string,
  repository: RealtimeScoringRepositoryContract = scoringRepository as RealtimeScoringRepositoryContract,
) {
  const url = new URL(requestUrl);
  const subscriptions = parseRealtimeSubscriptions(url.searchParams);
  const sessionParticipantIdsBySessionId = await buildSessionParticipantIdsBySessionId(user, subscriptions, repository);
  const connection = acceptRealtimeConnection({
    user,
    subscriptions,
    sessionParticipantIdsBySessionId,
  });

  try {
    return {
      connectionId: connection.connectionId,
      allowedScopes: connection.allowedScopes,
      transport: connection.transport,
      reconnectStrategy: connection.reconnectStrategy,
    };
  } finally {
    connection.close();
  }
}

export async function openRealtimeEventStream(
  user: SessionUser,
  requestUrl: string,
  signal: AbortSignal,
  repository: RealtimeScoringRepositoryContract = scoringRepository as RealtimeScoringRepositoryContract,
) {
  const url = new URL(requestUrl);
  const subscriptions = parseRealtimeSubscriptions(url.searchParams);
  const sessionParticipantIdsBySessionId = await buildSessionParticipantIdsBySessionId(user, subscriptions, repository);
  const bootstrap = acceptRealtimeConnection({
    user,
    subscriptions,
    sessionParticipantIdsBySessionId,
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let cleanedUp = false;
      let heartbeatId: ReturnType<typeof setInterval> | null = null;
      let brokerUnsubscribe: (() => void) | null = null;
      let localConnectionClose: (() => void) | null = null;
      const deliveredEventIds = new Set<string>();

      const cleanup = () => {
        if (cleanedUp) {
          return;
        }
        cleanedUp = true;
        if (heartbeatId) {
          clearInterval(heartbeatId);
        }
        brokerUnsubscribe?.();
        localConnectionClose?.();
        bootstrap.close();
        try {
          controller.close();
        } catch {
          // Stream may already be closed by the runtime.
        }
      };

      const emitFiltered = (event: RealtimeEventEnvelope) => {
        const filtered = filterRealtimeEventForSubscriber({
          subscriber: {
            user,
            subscriptions,
          },
          event,
        });

        if (!filtered) {
          return;
        }

        if (deliveredEventIds.has(filtered.eventId)) {
          return;
        }

        deliveredEventIds.add(filtered.eventId);
        writeSseEvent(controller, "message", filtered);
      };

      signal.addEventListener("abort", cleanup, { once: true });

      writeSseEvent(controller, "bootstrap", {
        connectionId: bootstrap.connectionId,
        allowedScopes: bootstrap.allowedScopes,
        transport: bootstrap.transport,
        reconnectStrategy: bootstrap.reconnectStrategy,
        subscriptions,
      });

      const localConnection = acceptRealtimeConnection({
        user,
        subscriptions,
        sessionParticipantIdsBySessionId,
        onEvent: emitFiltered,
      });
      localConnectionClose = () => {
        localConnection.close();
      };

      if (hasRedisRealtimeBroker()) {
        brokerUnsubscribe = subscribeToRealtimeBroker(emitFiltered);
      }

      heartbeatId = setInterval(() => {
        writeSseEvent(controller, "ping", { ts: new Date().toISOString() });
      }, HEARTBEAT_INTERVAL_MS);
    },
  });

  return new Response(stream, {
    headers: SSE_HEADERS,
  });
}

// Transport-agnostic sink for a realtime connection. The WebSocket server
// (server.ts) implements this over a `ws` socket; the logic below is identical
// to the SSE path (same hub, same broker, same auth filtering + dedupe) so
// there is no second source of truth for realtime lifecycle.
export interface RealtimeConnectionSink {
  send(event: string, data: unknown): void;
  isOpen(): boolean;
}

export async function openRealtimeWebSocketConnection(
  user: SessionUser,
  requestUrl: string,
  sink: RealtimeConnectionSink,
  repository: RealtimeScoringRepositoryContract = scoringRepository as RealtimeScoringRepositoryContract,
): Promise<{ dispose(): void }> {
  const url = new URL(requestUrl);
  const subscriptions = parseRealtimeSubscriptions(url.searchParams);
  const sessionParticipantIdsBySessionId = await buildSessionParticipantIdsBySessionId(user, subscriptions, repository);

  let heartbeatId: ReturnType<typeof setInterval> | null = null;
  let brokerUnsubscribe: (() => void) | null = null;
  let disposed = false;
  const deliveredEventIds = new Set<string>();

  const emitFiltered = (event: RealtimeEventEnvelope) => {
    if (!sink.isOpen()) {
      return;
    }
    const filtered = filterRealtimeEventForSubscriber({
      subscriber: { user, subscriptions },
      event,
    });
    if (!filtered || deliveredEventIds.has(filtered.eventId)) {
      return;
    }
    deliveredEventIds.add(filtered.eventId);
    sink.send("message", filtered);
  };

  const localConnection = acceptRealtimeConnection({
    user,
    subscriptions,
    sessionParticipantIdsBySessionId,
    onEvent: emitFiltered,
  });

  sink.send("bootstrap", {
    connectionId: localConnection.connectionId,
    allowedScopes: localConnection.allowedScopes,
    transport: localConnection.transport,
    reconnectStrategy: localConnection.reconnectStrategy,
    subscriptions,
  });

  if (hasRedisRealtimeBroker()) {
    brokerUnsubscribe = subscribeToRealtimeBroker(emitFiltered);
  }

  heartbeatId = setInterval(() => {
    if (sink.isOpen()) {
      sink.send("ping", { ts: new Date().toISOString() });
    }
  }, HEARTBEAT_INTERVAL_MS);

  return {
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      if (heartbeatId) {
        clearInterval(heartbeatId);
      }
      brokerUnsubscribe?.();
      localConnection.close();
    },
  };
}
