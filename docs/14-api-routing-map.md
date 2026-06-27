# API Routing Map

## Purpose

This document defines the backend API routing plan for the debate pairing system.

It exists separately from the broader backend architecture doc so that routing can be reviewed on its own.

It answers:

- which routes we need
- what each route should do
- which HTTP method each route should use
- who should be allowed to call it
- which backend service should handle it

This is a planning and implementation map, not a final OpenAPI spec.

## Routing Principles

The routing design should follow these rules:

- routes stay thin
- business logic lives in `lib/server/...`
- routes should group by domain concern
- role-based access should be explicit
- session-role-aware behavior should be enforced in service logic where needed

## Main Route Groups

The pairing-system backend should be grouped into these route families:

1. `attendance`
2. `sessions`
3. `pairing`
4. `scoring`
5. `leaderboard`
6. `eval`

## 1. Attendance Routes

These routes prepare the participant pool before pairing generation.

## `POST /api/attendance/prepare`

### Purpose

Create or reset attendance preparation context for a session.

### Access

- cabinet admin
- president admin

### Request body

```json
{
  "sessionId": "string"
}
```

### Response summary

- session attendance preparation state
- current participant list
- current role-assignment state

### Should call

- `prepareAttendance()` from `lib/server/sessions/attendance-service.ts`

## `POST /api/attendance/mark`

### Purpose

Mark attendance and session participation role for members.

### Access

- cabinet admin
- president admin

### Request body

```json
{
  "sessionId": "string",
  "entries": [
    {
      "memberId": "string",
      "isPresent": true,
      "sessionRole": "speaker"
    }
  ]
}
```

### Response summary

- updated attendance records
- updated session-role assignments

### Should call

- `markAttendance()` from `lib/server/sessions/attendance-service.ts`

## 2. Session Routes

These routes expose session state and session-specific setup context.

## `GET /api/sessions/:sessionId`

### Purpose

Return full session preparation or lifecycle context.

### Access

- cabinet admin
- president admin
- published-session read access can later be exposed through the public pairing route for members

### Response summary

- session metadata
- motion type and motion
- pairing status
- publication status
- scoring status
- attendance summary

### Should call

- `getSessionPreparationContext()` from `lib/server/sessions/session-service.ts`

## `PATCH /api/sessions/:sessionId`

### Purpose

Update session-level inputs before generation.

### Access

- cabinet admin
- president admin

### Request body

```json
{
  "motionType": "IR",
  "motionText": "This House would...",
  "pairingObjective": "BALANCED"
}
```

### Should call

- `updateSessionLifecycleState()` or session update method from `lib/server/sessions/session-service.ts`

## `GET /api/sessions/:sessionId/scoring-status`

### Purpose

Return whether post-session scoring is pending, open, partial, or complete, plus per-role
completion tracking: which participants have NOT yet submitted the form for their session role
(speakers who owe their speaker form, chairs who owe their adjudicator scores). This is
**completion tracking only** — it returns who has/hasn't submitted, never the content of anyone's
submission.

### Access

- cabinet admin
- president admin
- techhead admin (always-on oversight, read-only)
- session participants may see their own task status only

### Privacy boundary

- monitors (cabinet, president, techhead) may see completion status + participant identity
  (who hasn't filled their role's form)
- monitors may NOT see the content/scores another participant submitted; submission content is
  restricted (see `15 §16`), and the public derived output is the leaderboards
- only cabinet and president may act on the cycle (nudge pending, close scoring); techhead is
  read-only

### Should call

- scoring-status query via `session-service.ts` and `scoring-repository.ts`

## 3. Pairing Routes

These routes are the main generation, review, publication, and published-pairing read API.

## `POST /api/pairing/generate`

### Purpose

Generate a new pairing proposal for a session.

### Access

- cabinet admin only
- president admin only
- members are not allowed

### Request body

```json
{
  "sessionId": "string"
}
```

### Response summary

- generated proposal
- proposal score summary
- room and assignment structure
- unassigned leftover participants if any

### Should call

- request validation from `lib/server/validations/pairing-validation.ts`
- `generatePairingProposal()` from `lib/server/pairing/engine.ts`

## `GET /api/pairing/proposal/:proposalId`

### Purpose

Fetch one generated proposal and its review context.

### Access

- cabinet admin only
- president admin only

### Response summary

- proposal metadata
- room assignments
- team assignments
- adjudicator and chair assignments
- score breakdown summary
- review state

### Should call

- proposal fetch from `lib/server/repositories/pairing-repository.ts`

## `POST /api/pairing/proposal/:proposalId/approve`

### Purpose

Approve a proposal so it becomes eligible for publication.

### Access

- cabinet admin only
- president admin only

### Should call

- `approveProposal()` from `lib/server/pairing/review.ts`

## `POST /api/pairing/proposal/:proposalId/override`

### Purpose

Manually override part or all of a generated proposal.

### Access

- cabinet admin only
- president admin only

### Request body

```json
{
  "overrideType": "manual_assignment",
  "payload": {}
}
```

### Should call

- validation from `pairing-validation.ts`
- `overrideProposal()` from `lib/server/pairing/review.ts`

## `POST /api/pairing/proposal/:proposalId/regenerate`

### Purpose

Create a fresh proposal for the same session context.

### Access

- cabinet admin only
- president admin only

### Should call

- `regenerateProposal()` from `lib/server/pairing/review.ts`

## `POST /api/pairing/proposal/:proposalId/rate`

### Purpose

Store admin rating for proposal quality.

### Access

- cabinet admin only
- president admin only

### Request body

```json
{
  "rating": 4,
  "issueTags": ["weak_room_balance"],
  "notes": "Good overall but one room felt slightly top-heavy."
}
```

### Should call

- validation from `pairing-validation.ts`
- `rateProposal()` from `lib/server/pairing/review.ts`

## `POST /api/pairing/publish/:sessionId`

### Purpose

Publish the currently approved proposal for a session.

### Access

- cabinet admin only
- president admin only

### Response summary

- official published pairing
- finalized attendance status
- official room assignments

### Should call

- `publishApprovedProposal()` from `lib/server/pairing/publish.ts`

## `GET /api/pairing/published/:sessionId`

### Purpose

Return the official published pairing for a session after publication.

### Access

- member
- cabinet admin
- president admin

### Response summary

- published pairing metadata
- room assignments
- team assignments
- speaker roles
- adjudicator and chair assignments
- motion type and motion

### Should call

- published-pairing fetch from `pairing-repository.ts`
- published-session visibility check from `session-service.ts`

## 4. Scoring Routes

These routes handle post-session submissions.

## `POST /api/scoring/speaker`

### Purpose

Submit the speaker's post-session form. RESOLVED (Gate 4): the speaker does NOT enter their own
raw speaker score — the chair does that (see the chair route). The speaker form is intentionally
simple: rate the assigned chair, and optionally rate their own team dynamics.

### Access

- session participants who were speakers in that session

### Request body

```json
{
  "sessionId": "string",
  "chairScore": 8,
  "teamDynamicsRating": 7,
  "notes": "optional"
}
```

- `chairScore` — REQUIRED, integer 0–10 → stored as `ChairFeedbackRecord`; source for `chair_score`.
- `teamDynamicsRating` — OPTIONAL, integer 0–10 → stored as its own `TeamDynamicsRating` record
  (NOT on ChairFeedbackRecord), co-located with the partner-dynamics data. It is a
  secondary/auxiliary signal; `partner_dynamics_*` stays primarily results-based (`docs/05`).
- `notes` — OPTIONAL.

### Should call

- validation from `lib/server/validations/scoring-validation.ts`
- `submitSpeakerChairRating()` (writes ChairFeedbackRecord; if present, writes TeamDynamicsRating)
  from `lib/server/scoring/speaker-scoring-service.ts`

## `POST /api/scoring/chair`

### Purpose

Submit the chair's post-session form. RESOLVED (Gate 4): the chair has TWO responsibilities —
(1) score the panel adjudicators in their room, and (2) enter the raw speaker scores for the
speakers in their room. Kept as ONE route carrying two arrays; the UI presents two separate
sections/screens (one endpoint, separate UI — better UX than two endpoints).

### Access

- session participants who were chair in that session

### Request body

```json
{
  "sessionId": "string",
  "adjudicatorScores": [
    { "adjudicatorMemberId": "string", "rating": 8, "notes": "optional" }
  ],
  "speakerScores": [
    {
      "memberId": "string",
      "rawScore": 75,
      "bpPosition": "OG",
      "speakingRole": "PM",
      "teamResultPoints": 3
    }
  ]
}
```

- `adjudicatorScores[]` — chair-to-adjudicator ratings (0–10) → `AdjudicatorScoreRecord`,
  source for `adjudicator_average_score`.
- `speakerScores[]` — chair-entered raw speaker scores → `SpeakerScoreRecord` (records the chair
  as `scoredByMemberId` for audit). `rawScore` uses the existing raw speaker-score convention;
  `teamResultPoints` is the BP 3/2/1/0 outcome.

### Should call

- validation from `lib/server/validations/scoring-validation.ts`
- `submitChairAdjudicatorScore()` and `submitRoomSpeakerScores()`
  from `lib/server/scoring/chair-scoring-service.ts`

## 5. Leaderboard Routes

These routes expose derived leaderboard outputs.

## `GET /api/leaderboard/speakers`

### Purpose

Return speaker leaderboard data.

### Access

- authenticated users
- public later if desired

### Response summary

- overall speaker ranking
- motion-type-specific summary where supported

### Should call

- `recomputeSpeakerLeaderboard()` or read-model fetch from `lib/server/scoring/leaderboard-service.ts`

## `GET /api/leaderboard/adjudicators`

### Purpose

Return adjudicator leaderboard data.

### Access

- authenticated users

### Response summary

- adjudicator average ranking
- chair-related derived ranking where shown

### Should call

- `recomputeAdjudicatorLeaderboard()` or read-model fetch from `lib/server/scoring/leaderboard-service.ts`

## 6. Eval Routes

These routes are primarily admin or internal-use routes.

## `POST /api/eval/replay`

### Purpose

Run the eval harness on historical or synthetic scenarios.

### Access

- techhead admin
- president admin

### Request body

```json
{
  "runType": "historical_replay",
  "scenarioSet": "default",
  "runsPerScenario": 25,
  "baselineVersion": "string"
}
```

### Should call

- `runPairingEval()` from `lib/server/eval/harness.ts`

## `POST /api/eval/compare`

### Purpose

Compare one eval result against a baseline.

### Access

- techhead admin
- president admin

### Request body

```json
{
  "candidateEvalRunId": "string",
  "baselineEvalRunId": "string"
}
```

### Should call

- `compareEvalReports()` from `lib/server/eval/regression-checker.ts`

## 7. Progress / Analytics Routes (admin)

These routes expose per-person progress analytics built from the metric snapshots and raw records.
They are oversight/development tools, distinct from the public leaderboards (ranking).

UI integration: there is NO new progress page. The existing member & cabinet section in the cabinet
dashboard is the roster; hovering a row opens a progress popover that calls the per-participant
route below. The roster route is therefore optional (use it only if a batch summary is needed for
the list itself).

## `GET /api/progress/members` (optional batch summary)

### Purpose

Optional batch summary for the existing roster of participants (member, cabinet, and president — all
debate), e.g. to show a strength/data-maturity badge inline before hover. Not required if the
existing roster already has what it needs and only the hover fetches detail.

### Access

- cabinet
- president

### Response summary

- per participant: cumulative `speaker_total_score`, `speaker_strength` (with its confidence/data
  level), participation counts (sessions spoken / adjudicated / chaired), and a data-maturity flag
- sortable/filterable; low-data members flagged so their numbers aren't over-read

### Should call

- progress read from `lib/server/scoring/leaderboard-service.ts` (or a dedicated
  `member-progress-service.ts`) over `metrics-repository.ts` + `scoring-repository.ts`

## `GET /api/progress/members/:participantId`

### Purpose

Full progress profile for one participant.

### Access

- cabinet
- president
- a member may read their OWN profile only (self view); members cannot read others'

### Response summary

Two layers — the raw metrics AND a synthesized, human-readable verdict generated from them.

Raw metric layer:

- speaker: cumulative `speaker_total_score` overall + by motion type, `speaker_strength` with
  confidence, `role_score` per speaking role, `motion_type_x_role` highlights, `bp_position_history`
  and `internal_speaking_role_history` (rotation/diversity), notable `partner_dynamics`, academic year
- adjudicator/chair: `adjudicator_average_score`, `chair_score`, #adjudicated / #chaired, confidence
- trend over time + per-metric data-maturity (observation counts / confidence)

Verdict/insight layer (the "progress" the admin actually reads) — short statements derived from the
metrics, e.g.:

- motion-type strengths/weaknesses: "strong in IR, weak in Feminism"
- coverage gaps (low observation count): "few debates on Finance"
- role aptitude: "good as PM/DPM, weaker as Whip"
- pair compatibility: "pairs well with B; friction with C and D on certain motion types"

Verdict generation rules (thresholds are tunable — see open items):

- strength/weakness = a motion-type / role score notably above or below the participant's own
  baseline (or cohort baseline), only when confidence is sufficient
- gap = low observation count for a motion type or role (also drives a "needs data" flag)
- compatibility = high vs low `partner_dynamics_overall` / `partner_dynamics_by_motion_type` per pair
- never assert a verdict from thin data — if confidence is low, say "not enough data" instead

### Should call

- profile + verdict from the progress/insight service (e.g. `member-progress-service.ts`) over
  `metrics-repository.ts` + `scoring-repository.ts`. The service translates metrics into the verdict
  statements; it performs NO new scoring — it only interprets existing metrics/snapshots.

### Privacy

- admin profiles may include full metric detail (cabinet/president oversight); the member self-view
  is role-appropriate and excludes any admin-only annotations (`15 §16`)

## Auth And Access Expectations

This section summarizes the intended route access model.

## Cabinet And President Only Routes

- attendance preparation and marking
- session update before generation
- all pairing generation/review/publish routes except the published-pairing read route

## Session-role routes

- speaker scoring route
- chair scoring route

These must check session role, not only permanent account role.

## Scoring Monitoring / Oversight (read-only)

- `GET /api/sessions/:sessionId/scoring-status`

Post-session scoring progress and per-role completion tracking (who has/hasn't filled the form for
their session role) is readable by:

- cabinet
- president
- techhead

This is always-on oversight so President and TechHead can monitor completion across sessions and
see who still owes a submission. It exposes completion + identity only — never the content/scores
of anyone's submission (`15 §16`). Acting on the cycle (nudge pending, close scoring) stays
restricted to cabinet and president; techhead is read-only.

## Member Progress / Analytics (read)

- `GET /api/progress/members`
- `GET /api/progress/members/:participantId`

Per-person progress analytics (development trajectory + current metric profile) is readable by:

- cabinet
- president

Cabinet and president may view any participant's profile (members and cabinet). A member may view
their OWN profile only and never another participant's. Profiles surface per-metric data maturity so
low-data numbers are not over-read.

## Published Pairing Read Route

- `GET /api/pairing/published/:sessionId`

This should be visible once the pairing is published to:

- members
- cabinet
- president

## Admin/Internal Eval Routes

- eval replay
- eval compare

## Route Design Notes

### Keep routes thin

Routes should not contain formulas, candidate generation, metric fallback logic, or tuning logic.

### Prefer domain grouping

It is better to group routes by concern such as `pairing`, `scoring`, and `eval` instead of burying everything under old legacy route trees.

### Preserve auditability

Review routes and eval routes should preserve enough identifiers so that later investigation is possible.

## Recommended V1 Route Priority

If we build routes gradually, the highest-priority order is:

1. attendance routes
2. session setup route
3. pairing generate route
4. pairing review routes
5. pairing publish route
6. published pairing read route
7. speaker scoring route
8. chair scoring route
9. leaderboard routes
10. eval routes

## Summary

This routing map gives the backend a clear API surface for:

- session preparation
- pairing generation
- review and publication
- published pairing visibility for all society roles after publication
- role-based post-session scoring
- leaderboard reads
- evaluation and regression checks

It should be used together with:

- `11-backend-implementation-map.md`
- `12-backend-data-model-map.md`
- `13-pairing-learning-loop.md`

when we begin implementation.
