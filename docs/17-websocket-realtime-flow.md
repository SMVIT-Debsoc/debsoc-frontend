# Websocket Realtime Flow

## Purpose

This document defines the backend realtime delivery model for the debate pairing system.

It is authoritative for:

- when websocket delivery should be used
- which backend actions should emit realtime events
- who is allowed to receive which events
- how websocket delivery stays consistent with the authoritative HTTP and database state
- where websocket code should live so it does not break the existing service boundaries
- how realtime delivery improves UX without becoming a second source of truth

If this document conflicts with a lower-order implementation note, this file wins.

## Realtime Architecture Field

Websocket delivery is a separate architecture field in this system, not a detail hidden inside existing route phases.

It exists because good pairing UX depends on fast, trustworthy state updates for:

- admin session preparation
- proposal lifecycle review
- publication visibility
- scoring-window visibility
- leaderboard refresh timing

This is why realtime has its own dedicated build phase and its own backend module boundary.

## Core Principle

Websocket delivery is a secondary transport, not the source of truth.

The source of truth remains:

- the committed database state
- the published read model
- the guarded HTTP/API routes defined in `docs/14-api-routing-map.md`

Realtime delivery exists to reduce polling and to make state transitions visible quickly.
It must never become a path that publishes state earlier than the authoritative backend commit.

## 1. UX Goals

The websocket layer should improve UX in these concrete ways:

- admins should see attendance, proposal, and review changes without manual refresh
- members should see published pairings appear quickly once publication is official
- speakers and chairs should see scoring-window changes quickly enough that the flow feels live
- leaderboard views should refresh after scoring changes without repeated polling
- clients should be able to recover cleanly after reconnect without entering a broken or confusing state

### UX rules

The UX contract for realtime should be:

- fast visibility
- no early leaks
- no duplicate-state confusion
- no hidden writes
- graceful recovery after disconnect

### Why websocket matters here

The pairing system is workflow-heavy and stateful.
Without realtime delivery, users would rely on refresh loops during the most time-sensitive moments of the lifecycle.
That would create a worse admin review flow, slower member publication visibility, and a more fragile scoring experience.

## 2. Connection Model

### Route shape

The backend should expose one authenticated websocket entrypoint:

- `GET /api/realtime/socket`

This route is the upgrade or connection-bootstrap route for pairing-system realtime delivery.
The concrete Next.js route-handler mechanics must match the installed Next version when implemented.

### Authentication

The websocket connection must be authenticated before subscriptions are accepted.

Expected eligible roles:

- `Member`
- `cabinet`
- `President`
- `TechHead`

Authentication alone is not enough for event visibility.
Role-based and session-based filtering still apply after connection establishment.

### Authorization direction

Connection authorization answers only:

- may this user open a pairing-system realtime connection at all

Event authorization must still answer:

- may this user receive this event type
- may this user receive this session's details
- is the payload member-safe or admin-only
- is the user entitled because of permanent role, session role, or both

## 3. Subscription Model

The websocket layer should be session-aware.

V1 direction:

- one authenticated socket connection per client session is enough
- clients may subscribe to one or more session-scoped feeds
- clients may also subscribe to low-volume global feeds such as leaderboard-refresh notifications where allowed

### Subscription scopes

The backend should support at minimum these logical scopes:

- `SESSION_ADMIN`
- `SESSION_PUBLISHED`
- `SESSION_SCORING`
- `LEADERBOARD`

### Scope meaning

- `SESSION_ADMIN` is for cabinet/president admin lifecycle updates for one session
- `SESSION_PUBLISHED` is for published-pairing visibility that is safe for members
- `SESSION_SCORING` is for scoring-window and scoring-status updates tied to session role
- `LEADERBOARD` is for coarse leaderboard-refresh notifications, not raw private scoring detail

The exact TypeScript names should be shared through `types/realtime.ts`.

## 4. Event Envelope Standard

Every pairing-system websocket event should follow one stable envelope shape.

Minimum event metadata:

- `eventId`
- `eventType`
- `occurredAt`
- `sessionId` when session-scoped
- `proposalId` when proposal-scoped
- `visibility`
- `refetchHints`
- `entityVersion` or equivalent version/timestamp hints from the authoritative records

### Why this matters

Clients need enough information to:

- discard events they are not allowed to use
- reconcile stale local state
- decide whether a lightweight local update is enough
- decide whether to refetch the authoritative HTTP endpoint

The envelope should be stable and typed.

## 5. Event Types

The authoritative event catalog for V1 should include at minimum:

- `attendance.prepared`
- `attendance.marked`
- `session.updated`
- `pairing.proposal.generated`
- `pairing.proposal.approved`
- `pairing.proposal.overridden`
- `pairing.proposal.regenerated`
- `pairing.proposal.rated`
- `pairing.proposal.published`
- `scoring.window.opened`
- `scoring.submitted`
- `scoring.completed`
- `leaderboard.updated`

These names are transport-level event names.
They do not replace the route names or service names.

## 6. Visibility Rules

### Admin-only events

The following should be treated as admin-only session events unless a later doc explicitly broadens them:

- proposal generated
- proposal approved
- proposal overridden
- proposal regenerated
- proposal rated
- attendance/session preparation changes before publication

### Member-safe events

The following may be emitted to member-visible published scopes when the underlying state is already authorized for members:

- official pairing published
- scoring window opened for that session
- scoring completed for that session
- leaderboard updated

### Session-role-sensitive events

Scoring-related websocket notifications must respect the same session-role rule used by the HTTP scoring flow.
A websocket connection must not reveal scoring work meant for a different participant role in that session.

## 7. UX Delivery Pattern

The recommended client pattern is notify first, refetch second.

That means websocket events should usually tell the client:

- something important changed
- what changed at a high level
- which HTTP read path is now worth refreshing

The client should then decide whether to:

- apply a small safe local patch
- refetch the current session detail
- refetch the published pairing
- refetch the scoring status
- refetch the leaderboard view

### Why this pattern is better

This keeps UX fast without making the websocket payload the canonical view model.
It avoids stale partial client state and keeps the backend authority in one place.

## 8. Consistency Rules

### Post-commit only

A websocket event must be emitted only after the authoritative write has committed successfully.

This applies especially to:

- publish
- override
- score submission
- scoring completion
- leaderboard refresh triggers

If the transaction rolls back, no websocket event should be emitted for that failed action.

### HTTP remains authoritative

If the websocket layer and the HTTP read model disagree, clients must trust the HTTP read model.

### No hidden write path

The websocket layer must not mutate pairing state directly.
It is a delivery mechanism, not a state-changing API.

## 9. Recovery And Reconnect Rules

Realtime delivery is best-effort and recoverable.

The client recovery model should be:

1. reconnect websocket
2. resubscribe to the needed scopes
3. refetch the authoritative HTTP state for active sessions or dashboards
4. continue from the refreshed server truth

This means the backend does not need websocket delivery to be the only path by which state can be observed.

## 10. Backend Implementation Model

Routes must not emit websocket events directly.

The correct ownership is:

- route authenticates and validates
- service performs the authoritative action
- transaction commits or rolls back
- service calls a realtime publisher after commit
- realtime hub fans the event out to eligible subscribers

### Backend module direction

The realtime layer should live under:

- `lib/server/realtime/websocket-hub.ts`
- `lib/server/realtime/event-publisher.ts`
- `lib/server/realtime/channel-auth.ts`
- `lib/server/realtime/types.ts`

The route entrypoint should live at:

- `app/api/realtime/socket/route.ts`

Shared DTOs and event contracts should live at:

- `types/realtime.ts`

### Implementation responsibilities

- `websocket-hub.ts` owns connections, subscriptions, and event fan-out
- `channel-auth.ts` decides whether a connection may subscribe to a scope or session
- `event-publisher.ts` accepts post-commit domain events from services and forwards them to the hub
- `types/realtime.ts` defines event names, scopes, visibility types, and refetch hints shared across backend modules
- `app/api/realtime/socket/route.ts` is transport-only and must not contain pairing business logic

## 11. Event Sources By Service

Expected event emitters by backend area:

- session and attendance services emit `attendance.prepared`, `attendance.marked`, `session.updated`
- review and publish services emit proposal lifecycle events and `pairing.proposal.published`
- scoring services emit `scoring.window.opened`, `scoring.submitted`, `scoring.completed`
- leaderboard service emits `leaderboard.updated`

These should be emitted from service-level orchestration only, never from repositories and never from route handlers.

## 12. Failure Handling

If websocket delivery fails after the authoritative transaction succeeded:

- the authoritative action must still remain committed
- the failure must be logged and observable
- the client must still be able to recover through HTTP refetch

A websocket fan-out failure must not roll back a successful publish or score submission.

## 13. Security And Privacy Rules

The websocket layer must obey the same exposure rules as the HTTP layer.

It must not:

- leak admin review notes to members
- leak unpublished pairing proposals to members
- leak scoring details to unauthorized participants
- assume permanent account role is enough for scoring notifications

The websocket transport should send only the minimum payload needed for UI refresh and reconciliation.
If a richer view is needed, clients should refetch through the authorized HTTP route.

## 14. Observability

The backend should log and measure at minimum:

- websocket connection open/close
- authentication failure during connection or subscribe
- subscribe/unsubscribe activity by scope
- emitted event count by event type
- dropped event count
- reconnect rate
- fan-out errors
- average delay from commit to emit

## 15. Testing Expectations

The websocket layer needs explicit backend tests.

Minimum coverage should include:

- authenticated connection succeeds for allowed roles
- unauthorized connection or subscription is rejected
- members never receive unpublished proposal events
- admin subscribers receive proposal lifecycle events after commit
- publish emits exactly one member-safe published event after success
- scoring events respect session-role visibility
- reconnect plus HTTP refetch recovers correct state after a dropped connection
- websocket publish failure does not corrupt authoritative transaction state

## Summary

The pairing-system websocket layer should be:

- a separate architecture field with its own build phase
- authenticated
- role-filtered
- session-aware
- post-commit only
- supplemental to HTTP, not a replacement for it
- designed for notify-first, refetch-second UX
- observable and recoverable
- implemented in a dedicated realtime module, not scattered through routes
