import type { SessionUser } from "../roles";
import type { RealtimeConnectionBootstrap, RealtimeEventEnvelope, RealtimeSubscription } from "../../../types/realtime.ts";

export interface RealtimeSubscriberContext {
  user: SessionUser;
  subscriptions: RealtimeSubscription[];
}

export interface AcceptRealtimeConnectionInput {
  user: SessionUser;
  connectionId?: string;
  subscriptions?: RealtimeSubscription[];
  sessionParticipantIdsBySessionId?: Map<string, string[]>;
  onEvent?: (event: RealtimeEventEnvelope) => void;
}

export interface RealtimeConnectionHandle extends RealtimeConnectionBootstrap {
  subscribe(subscription: RealtimeSubscription): void;
  unsubscribe(subscription: RealtimeSubscription): void;
  takeEvents(): RealtimeEventEnvelope[];
  close(): void;
}

export interface RealtimeConnectionRecord extends RealtimeSubscriberContext {
  connectionId: string;
  bufferedEvents: RealtimeEventEnvelope[];
  sessionParticipantIdsBySessionId: Map<string, string[]>;
  onEvent?: (event: RealtimeEventEnvelope) => void;
}

export interface FilterRealtimeEventInput {
  subscriber: RealtimeSubscriberContext;
  event: RealtimeEventEnvelope;
}

export interface RealtimePublishResult {
  deliveredCount: number;
  droppedCount: number;
  activeConnectionCount: number;
}
