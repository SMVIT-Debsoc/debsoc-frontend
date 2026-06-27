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

Return whether post-session scoring is pending, open, partial, or complete.

### Access

- cabinet admin
- president admin
- session participants where relevant

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

Submit speaker-side post-session inputs.

### Access

- session participants who were speakers in that session

### Request body

Expected to include speaker-side inputs such as:

```json
{
  "sessionId": "string",
  "speakerScore": 74,
  "chairRating": 4,
  "notes": "optional"
}
```

### Should call

- validation from `lib/server/validations/scoring-validation.ts`
- `submitSpeakerScore()`
- `submitSpeakerChairRating()`

Both from `lib/server/scoring/speaker-scoring-service.ts`

## `POST /api/scoring/chair`

### Purpose

Submit chair-to-adjudicator scoring.

### Access

- session participants who were chair in that session

### Request body

```json
{
  "sessionId": "string",
  "scores": [
    {
      "adjudicatorMemberId": "string",
      "rating": 4,
      "notes": "optional"
    }
  ]
}
```

### Should call

- validation from `lib/server/validations/scoring-validation.ts`
- `submitChairAdjudicatorScore()` from `lib/server/scoring/chair-scoring-service.ts`

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
