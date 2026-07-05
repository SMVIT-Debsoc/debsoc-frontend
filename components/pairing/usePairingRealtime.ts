"use client";

import { useEffect, useEffectEvent, useMemo } from "react";
import type { RealtimeConnectionBootstrap, RealtimeEventEnvelope, RealtimeSubscription } from "@/types/realtime";

type RealtimeTransport = "sse" | "ws";

const SSE_PATH = "/api/realtime/socket";
const WS_PATH = "/api/realtime/ws";

function buildRealtimeQuery(subscriptions: RealtimeSubscription[]) {
  const params = new URLSearchParams();
  params.set("stream", "1");
  for (const subscription of subscriptions) {
    params.append(
      "subscription",
      subscription.scope === "LEADERBOARD"
        ? subscription.scope
        : `${subscription.scope}:${subscription.sessionId}`,
    );
  }
  return params.toString();
}

function buildSseUrl(subscriptions: RealtimeSubscription[]) {
  return `${SSE_PATH}?${buildRealtimeQuery(subscriptions)}`;
}

function buildWsUrl(subscriptions: RealtimeSubscription[]) {
  // WebSocket needs an absolute ws(s):// URL. Cookies (next-auth JWT session)
  // are sent automatically on a same-origin handshake, matching the SSE path.
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${window.location.host}${WS_PATH}?${buildRealtimeQuery(subscriptions)}`;
}

export function usePairingRealtime(options: {
  enabled: boolean;
  subscriptions: RealtimeSubscription[];
  transport?: RealtimeTransport;
  onBootstrap?: (bootstrap: RealtimeConnectionBootstrap & { subscriptions: RealtimeSubscription[] }) => void;
  onEvent?: (event: RealtimeEventEnvelope) => void;
}) {
  const { enabled, subscriptions, transport = "sse", onBootstrap, onEvent } = options;

  const handleBootstrap = useEffectEvent((bootstrap: RealtimeConnectionBootstrap & { subscriptions: RealtimeSubscription[] }) => {
    onBootstrap?.(bootstrap);
  });
  const handleEvent = useEffectEvent((event: RealtimeEventEnvelope) => {
    onEvent?.(event);
  });

  const key = useMemo(() => {
    if (!enabled || subscriptions.length === 0) {
      return null;
    }
    return `${transport}:${buildRealtimeQuery(subscriptions)}`;
  }, [enabled, subscriptions, transport]);

  useEffect(() => {
    if (!key) {
      return;
    }

    if (transport === "ws") {
      const socket = new WebSocket(buildWsUrl(subscriptions));

      socket.addEventListener("message", (event) => {
        try {
          const frame = JSON.parse((event as MessageEvent).data) as { event: string; data: unknown };
          if (frame.event === "bootstrap") {
            handleBootstrap(frame.data as RealtimeConnectionBootstrap & { subscriptions: RealtimeSubscription[] });
          } else if (frame.event === "message") {
            handleEvent(frame.data as RealtimeEventEnvelope);
          }
          // "ping" frames are keep-alive only and need no handling.
        } catch {
          // Ignore malformed frames.
        }
      });

      return () => {
        socket.close();
      };
    }

    const source = new EventSource(buildSseUrl(subscriptions), { withCredentials: true });

    source.addEventListener("bootstrap", (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as RealtimeConnectionBootstrap & { subscriptions: RealtimeSubscription[] };
        handleBootstrap(parsed);
      } catch {
        // Ignore malformed bootstrap payloads.
      }
    });

    source.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as RealtimeEventEnvelope;
        handleEvent(parsed);
      } catch {
        // Ignore malformed event payloads.
      }
    });

    return () => {
      source.close();
    };
    // subscriptions is captured via `key`, which changes whenever the query does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
