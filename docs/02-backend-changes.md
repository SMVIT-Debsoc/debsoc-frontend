# Backend Changes

## Purpose

This document describes the backend-level changes required to support the debate pairing system. It focuses on system behavior, data flow, and backend responsibilities rather than frontend presentation.

The pairing system will require major changes to the current backend because the pairing lifecycle touches attendance, session state, scoring, leaderboard updates, review workflows, adaptive tuning, and realtime delivery.

## Overall Backend Direction

The backend will move from a simpler session-and-attendance model to a lifecycle-driven workflow:

1. admin prepares the session
2. engine generates pairing proposals
3. admin reviews and rates a proposal
4. approved proposal becomes public
5. session runs
6. post-session scoring is submitted
7. leaderboard and history data update
8. tuning inputs are stored for later learning

## Access-Control Direction

Pairing lifecycle control must be restricted at the backend level.

### Cabinet and president only

The following actions should only be available to cabinet and president roles:

- prepare pairing generation inputs
- generate pairing proposals
- review proposals
- approve proposals
- override proposals
- regenerate proposals
- rate proposal quality
- publish the approved proposal

### Member visibility after publication

Members should not be allowed to generate or control pairings, but once a pairing is officially published, members should be able to view the official published pairing for that session.

The same published view should be readable by:

- member
- cabinet
- president

This means the backend needs two access paths:

- restricted write/control routes for cabinet and president
- published read route for all society roles after publication

## 1. Attendance Flow Changes

The attendance area becomes the entry point for pairing generation.

### New backend behavior

- attendance determines who is available for the current session
- each present person must be tagged with a session role
- valid roles currently discussed are:
  - speaker
  - adjudicator
- the old idea of attendance as a place for manual pairing state should be removed

### Operational changes

- admin marks users as present
- admin identifies how each present user is participating
- the pairing engine uses that as the starting pool
- once pairing is published, attendance becomes finalized automatically

### Old behavior to remove

- manual paired status in attendance
- speaker score handling inside attendance
- motion input inside attendance

## 2. Session Flow Changes

The session system needs to become pairing-aware and lifecycle-aware.

### New session lifecycle

- session starts with attendance preparation
- roles are assigned to present participants
- session-level inputs are captured
- pairing proposal is generated
- proposal is reviewed and published
- post-session scoring is collected
- session is marked complete

### Required backend capabilities

- session stores motion type and motion
- session stores pairing objective
- session tracks pairing state
- session tracks whether scoring is complete
- session tracks whether the final pairing has been published

## 3. Pairing Generation Service

The pairing engine should live as a dedicated backend service module rather than being scattered across route handlers.

### Service responsibilities

- load active metrics and generation rules
- read relevant historical data
- read current attendance and role assignment
- read current motion and session-specific inputs
- compute many candidate arrangements
- score them
- select one proposal probabilistically from the top band
- build and persist the proposal

## 4. Admin Review Workflow

The backend must support a review-first publication model.

### Required actions

- generate proposal
- approve proposal
- override proposal
- regenerate proposal
- rate proposal quality
- publish approved proposal

### Key rule

The pairing should never become public immediately after generation. Generation creates a proposal. Publication happens only after explicit review.

## 5. Pairing Publish Flow

When a proposal is approved and published, the backend needs to trigger several downstream effects.

### On publication

- pairing becomes available to users
- attendance becomes finalized
- room assignments become official
- leftover unassigned participants remain visible
- session state changes from preparation to active or published

## 6. Post-Session Scoring Flow

Once the debate session ends, the backend must open a scoring phase.

### Expected roles (RESOLVED — Gate 4)

- speakers submit a simple form: score the assigned chair (0–10) and optionally rate their own
  team dynamics (0–10). Speakers do NOT enter their own raw speaker score.
- regular (non-chair) adjudicators do not submit anything
- chairs submit two things for their room: (1) score the panel adjudicators (0–10), and (2) enter
  the raw speaker scores for the speakers in that room

The chair is therefore the entry point for raw speaker scores; the speaker is the entry point for
chair quality and optional team-dynamics feedback.

### Backend responsibilities

- validate who is allowed to submit which score
- ensure a user only sees relevant forms
- prevent unrelated scoring submissions
- store the score data cleanly for leaderboard and history use

## 7. Role-Aware Dashboard Backend

The dashboard data layer needs to become role-aware.

The same user may appear in different contexts across sessions. For one session a user may be a speaker. For another session they may be an adjudicator. In some situations they may be a chair.

### The backend must be able to answer

- what role is this user assigned for the current session
- what scoring form should they receive
- what data should be writable by them
- what history should be shown to them

## 8. Leaderboard Update Logic

The leaderboard system will need to update from post-session scoring rather than being loosely tied to current attendance or session records.

### Speaker leaderboard should account for

- total speaker score — a **cumulative sum** across sessions (NOT an average), so attendance and
  repeated performance are rewarded and a low-attendance member cannot rank high on a small-sample
  average
- motion-type-specific speaker score — same cumulative shape, per motion type
- role-specific score later where useful

### Adjudicator leaderboard should account for

- adjudicator scoring **average** — the ranking value (chair scores each adjudicator individually,
  averaged across sessions); NOT cumulative and NOT boosted by adjudication count, so a member who
  also speaks in some sessions is not penalized for adjudicating fewer times
- chair-related score inputs
- number of times serving as adjudicator — shown as context only, not a ranking multiplier
- number of times serving as chair where needed — context only

Speaker ranking is cumulative (rewards attendance); adjudicator ranking is a pure average (lets
members split between speaking and adjudicating without distorting the board). Counts are displayed
for context but never inflate adjudicator rank. The backend should be designed so leaderboard
values are derived from raw scoring data and can be recalculated safely.

## 9. Metrics And Configuration Handling

The pairing engine will depend on a set of metrics that need to be configurable and persisted.

Current direction:

- important pairing metrics should be stored in the database
- each metric should have metadata such as type, base weight, learned adjustment, enabled state, and scope
- generation logic may still reference external structural configuration, but metric records themselves should be first-class data

## 10. Adaptive Tuning Support

The backend should store the data needed for periodic tuning.

### This includes

- proposal score summaries
- admin proposal ratings
- post-session outcomes
- issue tags where applicable
- metric version or weight snapshot used during generation

This makes periodic tuning auditable instead of opaque.

## 11. API Surface Implications

Although exact routes are still to be finalized, the backend will likely need endpoints or service actions for:

- attendance preparation
- role assignment in a session
- pairing generation
- pairing proposal retrieval
- proposal review actions
- proposal rating submission
- publication
- speaker scoring submission
- chair scoring submission
- leaderboard retrieval
- session detail retrieval


## 12. Realtime Websocket Flow

The backend should support an authenticated websocket layer for fast pairing-system updates.

### Required backend direction

- websocket delivery is supplemental to HTTP, not the source of truth
- events are emitted only after the authoritative transaction commits
- admin-only proposal and review events stay restricted to cabinet and president views
- member-visible realtime updates begin only when the underlying state is already member-safe
- reconnecting clients must be able to recover by refetching the authoritative HTTP state

### Expected realtime domains

- attendance and session preparation updates for admins
- proposal lifecycle updates for admins
- published pairing updates for members and admins
- scoring-window and scoring-status updates for participants and admins
- leaderboard refresh notifications after scoring changes are processed
## 13. Removal And Deprecation Impact

Some existing backend flows are expected to be removed or replaced as part of this redesign.

### Expected removals

- anonymous feedback message flow
- task assignment flow
- attendance-linked speaker scoring flow
- attendance-linked manual pairing behavior

Retired in backend cleanup:

- anonymous feedback routes now return `410 Gone`, and the unused `AnonymousMessage` /
  `AnonymousFeedback` tables have been retired from the active schema
- task assignment routes now return `410 Gone`, and the unused `task` table has been retired from
  the active schema


## Summary

At the backend level, the pairing system is not one isolated feature. It is a coordinated state machine for debate sessions with proposal review, role-based scoring, and adaptive learning inputs.


