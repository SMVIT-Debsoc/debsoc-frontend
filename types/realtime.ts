import type { MemberId, ProposalId, SessionId } from "./pairing.ts";

export const realtimeSubscriptionScopes = [
  "SESSION_ADMIN",
  "SESSION_PUBLISHED",
  "SESSION_SCORING",
  "LEADERBOARD",
] as const;
export type RealtimeSubscriptionScope = (typeof realtimeSubscriptionScopes)[number];

export const realtimeEventTypes = [
  "attendance.prepared",
  "attendance.marked",
  "session.updated",
  "pairing.proposal.generated",
  "pairing.proposal.approved",
  "pairing.proposal.overridden",
  "pairing.proposal.regenerated",
  "pairing.proposal.rated",
  "pairing.proposal.published",
  "scoring.window.opened",
  "scoring.submitted",
  "scoring.completed",
  "leaderboard.updated",
] as const;
export type RealtimeEventType = (typeof realtimeEventTypes)[number];

export const realtimeVisibilities = ["ADMIN_ONLY", "MEMBER_SAFE", "SESSION_ROLE_ONLY"] as const;
export type RealtimeVisibility = (typeof realtimeVisibilities)[number];

export const realtimeRefetchHints = [
  "session_detail",
  "published_pairing",
  "scoring_status",
  "leaderboard",
] as const;
export type RealtimeRefetchHint = (typeof realtimeRefetchHints)[number];

export interface RealtimeEventEnvelope {
  eventId: string;
  eventType: RealtimeEventType;
  occurredAt: string;
  sessionId: SessionId | null;
  proposalId: ProposalId | null;
  visibility: RealtimeVisibility;
  refetchHints: RealtimeRefetchHint[];
  entityVersion: string | null;
  audienceParticipantIds?: MemberId[];
}

export interface RealtimeSubscription {
  scope: RealtimeSubscriptionScope;
  sessionId?: SessionId;
}

export interface RealtimeConnectionBootstrap {
  connectionId: string;
  allowedScopes: RealtimeSubscriptionScope[];
  transport: "WEBSOCKET_SUPPLEMENTAL";
  reconnectStrategy: "AUTHENTICATED_RESUBSCRIBE_THEN_HTTP_REFETCH";
}
