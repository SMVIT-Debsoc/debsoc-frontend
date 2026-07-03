"use client";

import { useEffect, useEffectEvent, useMemo } from "react";
import type { RealtimeConnectionBootstrap, RealtimeEventEnvelope, RealtimeSubscription } from "@/types/realtime";

function buildRealtimeUrl(subscriptions: RealtimeSubscription[]) {
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
  return `/api/realtime/socket?${params.toString()}`;
}

export function usePairingRealtime(options: {
  enabled: boolean;
  subscriptions: RealtimeSubscription[];
  onBootstrap?: (bootstrap: RealtimeConnectionBootstrap & { subscriptions: RealtimeSubscription[] }) => void;
  onEvent?: (event: RealtimeEventEnvelope) => void;
}) {
  const { enabled, subscriptions, onBootstrap, onEvent } = options;

  const handleBootstrap = useEffectEvent((bootstrap: RealtimeConnectionBootstrap & { subscriptions: RealtimeSubscription[] }) => {
    onBootstrap?.(bootstrap);
  });
  const handleEvent = useEffectEvent((event: RealtimeEventEnvelope) => {
    onEvent?.(event);
  });

  const url = useMemo(() => {
    if (!enabled || subscriptions.length === 0) {
      return null;
    }
    return buildRealtimeUrl(subscriptions);
  }, [enabled, subscriptions]);

  useEffect(() => {
    if (!url) {
      return;
    }

    const source = new EventSource(url, { withCredentials: true });

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
  }, [url]);
}
