import type { SessionUser } from "../roles";
import type { RealtimeEventEnvelope, RealtimeSubscription } from "../../../types/realtime.ts";
import type { FilterRealtimeEventInput } from "./types.ts";

function isRealtimeAdminRole(role: SessionUser["role"]) {
  return role === "cabinet" || role === "President" || role === "TechHead";
}

export function canConnectToRealtime(user: SessionUser) {
  return ["Member", "cabinet", "President", "TechHead"].includes(user.role);
}

export function canSubscribeToRealtimeScope(input: {
  user: SessionUser;
  subscription: RealtimeSubscription;
  sessionParticipantIds?: string[];
}) {
  if (!canConnectToRealtime(input.user)) {
    return false;
  }

  switch (input.subscription.scope) {
    case "SESSION_ADMIN":
      return !!input.subscription.sessionId && isRealtimeAdminRole(input.user.role);
    case "SESSION_PUBLISHED":
      return !!input.subscription.sessionId;
    case "SESSION_SCORING":
      return !!input.subscription.sessionId && (
        isRealtimeAdminRole(input.user.role) ||
        (input.sessionParticipantIds ?? []).includes(input.user.id)
      );
    case "LEADERBOARD":
      return true;
    default:
      return false;
  }
}

function eventScopes(eventType: RealtimeEventEnvelope["eventType"]) {
  switch (eventType) {
    case "attendance.prepared":
    case "attendance.marked":
    case "session.updated":
    case "pairing.proposal.generated":
    case "pairing.proposal.approved":
    case "pairing.proposal.overridden":
    case "pairing.proposal.regenerated":
    case "pairing.proposal.rated":
      return ["SESSION_ADMIN"] as const;
    case "pairing.proposal.published":
      return ["SESSION_ADMIN", "SESSION_PUBLISHED"] as const;
    case "scoring.window.opened":
    case "scoring.submitted":
    case "scoring.completed":
      return ["SESSION_ADMIN", "SESSION_SCORING"] as const;
    case "leaderboard.updated":
      return ["LEADERBOARD"] as const;
    default:
      return [] as const;
  }
}

function sanitizeEvent(event: RealtimeEventEnvelope): RealtimeEventEnvelope {
  const { audienceParticipantIds: _audienceParticipantIds, ...sanitized } = event;
  return sanitized;
}

export function filterRealtimeEventForSubscriber(input: FilterRealtimeEventInput) {
  const allowedScopes = new Set(eventScopes(input.event.eventType));
  const matchesSubscription = input.subscriber.subscriptions.some((subscription) => {
    if (!allowedScopes.has(subscription.scope)) {
      return false;
    }

    if (subscription.scope === "LEADERBOARD") {
      return true;
    }

    return !!subscription.sessionId && subscription.sessionId === input.event.sessionId;
  });

  if (!matchesSubscription) {
    return null;
  }

  if (input.event.visibility === "ADMIN_ONLY" && !isRealtimeAdminRole(input.subscriber.user.role)) {
    return null;
  }

  if (
    input.event.visibility === "SESSION_ROLE_ONLY" &&
    !isRealtimeAdminRole(input.subscriber.user.role) &&
    !(input.event.audienceParticipantIds ?? []).includes(input.subscriber.user.id)
  ) {
    return null;
  }

  return sanitizeEvent(input.event);
}
