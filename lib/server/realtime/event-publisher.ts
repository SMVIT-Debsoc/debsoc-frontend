import { broadcastRealtimeEvent } from "./websocket-hub.ts";
import type { RealtimeEventEnvelope } from "../../../types/realtime.ts";

export async function publishRealtimeEvent(event: RealtimeEventEnvelope) {
  try {
    return broadcastRealtimeEvent(event);
  } catch (error) {
    console.error("Realtime publish failed", error);
    return {
      deliveredCount: 0,
      droppedCount: 1,
      activeConnectionCount: 0,
    };
  }
}

export async function publishSessionRealtimeEvent(sessionId: string, event: RealtimeEventEnvelope) {
  return publishRealtimeEvent({
    ...event,
    sessionId,
  });
}
