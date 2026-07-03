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
  getPublishedScoringContext(sessionId: string): Promise<{
    roles: Array<{ participantId: string }>;
  } | null>;
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

  if (scope === "LEADERBOARD") {
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

function parseRealtimeSubscriptions(searchParams: URLSearchParams): RealtimeSubscription[] {
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
  subscriptions: RealtimeSubscription[],
  repository: RealtimeScoringRepositoryContract,
) {
  const scoringSessionIds = [...new Set(
    subscriptions
      .filter((subscription) => subscription.scope === "SESSION_SCORING")
      .map((subscription) => subscription.sessionId)
      .filter((sessionId): sessionId is string => Boolean(sessionId)),
  )];

  const participantIdsBySessionId = new Map<string, string[]>();
  await Promise.all(
    scoringSessionIds.map(async (sessionId) => {
      const context = await repository.getPublishedScoringContext(sessionId);
      participantIdsBySessionId.set(
        sessionId,
        [...new Set((context?.roles ?? []).map((role) => role.participantId).filter(Boolean))],
      );
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
  const sessionParticipantIdsBySessionId = await buildSessionParticipantIdsBySessionId(subscriptions, repository);
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
  const sessionParticipantIdsBySessionId = await buildSessionParticipantIdsBySessionId(subscriptions, repository);
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

      if (hasRedisRealtimeBroker()) {
        bootstrap.close();
        brokerUnsubscribe = subscribeToRealtimeBroker(emitFiltered);
      } else {
        bootstrap.close();
        const localConnection = acceptRealtimeConnection({
          user,
          subscriptions,
          sessionParticipantIdsBySessionId,
          onEvent: (event) => writeSseEvent(controller, "message", event),
        });
        localConnectionClose = () => {
          localConnection.close();
        };
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
