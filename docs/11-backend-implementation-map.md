# Backend Implementation Map

## Purpose

This document translates the planning work into a concrete backend file and folder structure for the current project.

It answers:

- where the new pairing system code should live
- which folders should own which responsibility
- which files should be created
- what each file should export
- how API routes should connect to services
- which current areas are likely to be replaced or reduced later

This is not the frontend plan. This is the backend implementation map only.

## Guiding Principle

Routes should stay thin.

The real business logic should live in `lib/server/`.

That means:

- `app/api/...` should parse requests, call guards, call services, and format responses
- `lib/server/...` should contain pairing logic, scoring logic, evaluation logic, and database orchestration
- Prisma access should be grouped in repository-style files instead of being spread across route handlers

This structure fits the current repo because the project already uses `lib/server/` for backend-oriented code.

## Fixed Reference Docs For Implementation

The following docs should now be treated as fixed implementation references during backend build work:

- `12-backend-data-model-map.md`
- `13-pairing-learning-loop.md`
- `14-api-routing-map.md`

What each one controls:

- `12-backend-data-model-map.md` controls entity naming, relationships, and the minimum V1 data-model direction
- `13-pairing-learning-loop.md` controls how metric updates, confidence growth, and periodic tuning affect service boundaries and stored data
- `14-api-routing-map.md` controls endpoint grouping, access rules, and route-to-service mapping

These should not be treated as optional reading once implementation begins.

## Recommended Folder Structure

```text
app/
  api/
    pairing/
      generate/route.ts
      proposal/[proposalId]/route.ts
      proposal/[proposalId]/approve/route.ts
      proposal/[proposalId]/override/route.ts
      proposal/[proposalId]/regenerate/route.ts
      proposal/[proposalId]/rate/route.ts
      publish/[sessionId]/route.ts
      published/[sessionId]/route.ts
    sessions/
      [sessionId]/route.ts
      [sessionId]/scoring-status/route.ts
    attendance/
      prepare/route.ts
      mark/route.ts
    scoring/
      speaker/route.ts
      chair/route.ts
    eval/
      replay/route.ts
      compare/route.ts

lib/
  server/
    pairing/
      engine.ts
      candidate-generator.ts
      proposal-scorer.ts
      proposal-selector.ts
      hard-rules.ts
      fallback.ts
      objectives.ts
      leftovers.ts
      chair-assignment.ts
      metrics-loader.ts
      tuning.ts
      review.ts
      publish.ts
      types.ts
    sessions/
      session-service.ts
      attendance-service.ts
      session-role-service.ts
    scoring/
      speaker-scoring-service.ts
      chair-scoring-service.ts
      leaderboard-service.ts
      metric-update-service.ts
    eval/
      harness.ts
      replay-runner.ts
      regression-checker.ts
      report-builder.ts
      synthetic-scenarios.ts
      types.ts
    repositories/
      pairing-repository.ts
      session-repository.ts
      scoring-repository.ts
      metrics-repository.ts
      eval-repository.ts
    validations/
      pairing-validation.ts
      scoring-validation.ts
      session-validation.ts

types/
  pairing.ts
  session.ts
  scoring.ts
  eval.ts
```

## Why This Structure Is Recommended

### `app/api/...`

This should remain the transport layer only.

Responsibilities:

- parse request body and params
- run auth and role guards
- call one backend service
- return JSON response

Non-responsibilities:

- no pairing formulas
- no candidate generation
- no leaderboard recomputation logic
- no direct tuning logic

### `lib/server/pairing/...`

This is the heart of the pairing system.

It should contain:

- pairing generation
- scoring formulas
- probabilistic selection
- hard-rule validation
- objective-mode handling
- leftover handling
- chair assignment
- proposal review workflow
- publication transition
- published pairing read logic

### `lib/server/scoring/...`

This should own the post-session phase.

It should contain:

- speaker scoring submission handling
- chair scoring submission handling
- leaderboard update logic
- metric history update logic

### `lib/server/eval/...`

This should own evaluation and regression testing.

It should contain:

- replay evaluation
- baseline comparison
- repeated probabilistic run orchestration
- report generation
- synthetic scenarios

### `lib/server/repositories/...`

This layer keeps Prisma access organized.

Benefits:

- route handlers stay clean
- pairing engine stays focused on domain logic
- query behavior becomes easier to change later

### `types/...`

Shared backend data contracts should live here so routes, services, and repositories all speak the same types.

## Pairing Module File Map

This section defines the most important files in the pairing engine.

## `lib/server/pairing/engine.ts`

### Responsibility

Top-level orchestrator for the pairing engine.

### Should export

- `generatePairingProposal(input: GeneratePairingProposalInput): Promise<PairingProposalResult>`

### What it should do

1. load session data and participants
2. load metrics and active rules
3. run feasibility checks
4. generate candidates
5. score candidates
6. select one proposal from the top band
7. persist the generated proposal
8. return proposal summary

### What it should not do

- raw Prisma queries directly if avoidable
- request parsing
- HTTP response shaping

## `lib/server/pairing/candidate-generator.ts`

### Responsibility

Generate many valid candidate arrangements.

### Should export

- `generateCandidateProposals(context: PairingGenerationContext): PairingCandidate[]`

### What it should do

- build candidate speaker teams
- assign BP positions
- assign speaking roles
- group teams into rooms
- assign adjudicators and chairs tentatively
- generate multiple valid alternatives

## `lib/server/pairing/proposal-scorer.ts`

### Responsibility

Calculate soft scores for each candidate proposal.

### Should export

- `scoreProposal(candidate: PairingCandidate, context: PairingGenerationContext): ScoredPairingCandidate`
- `scoreTeam(team: TeamCandidate, context: PairingGenerationContext): number`

### What it should do

- apply metric weights
- apply objective-mode multipliers
- calculate room-level and team-level score layers
- apply repetition penalties
- calculate final proposal score

## `lib/server/pairing/proposal-selector.ts`

### Responsibility

Select one proposal from the top candidate band probabilistically.

### Should export

- `selectProposalFromTopBand(candidates: ScoredPairingCandidate[], options: SelectionOptions): ScoredPairingCandidate`

### What it should do

- sort by score
- keep top `N`
- apply top-band weighted randomness
- return selected proposal

## `lib/server/pairing/hard-rules.ts`

### Responsibility

Validate hard constraints.

### Should export

- `validateHardRules(candidate: PairingCandidate, context: PairingGenerationContext): HardRuleValidationResult`
- `isCandidateValid(candidate: PairingCandidate, context: PairingGenerationContext): boolean`

### What it should do

- check room validity
- check no duplicate assignments
- check presence and session-role eligibility
- check strict session-only inputs
- check chair and adjudicator coverage

## `lib/server/pairing/fallback.ts`

### Responsibility

Centralize confidence-based fallback logic.

### Should export

- `computeConfidence(observationCount: number, targetCount: number): number`
- `blendSpecificWithFallback(specific: number, fallback: number, confidence: number): number`
- `resolveMetricWithFallback(input: FallbackMetricInput): number`

### What it should do

- implement observation-count confidence
- implement blending formula
- support metric fallback chains

## `lib/server/pairing/objectives.ts`

### Responsibility

Apply `DEVELOPMENT`, `BALANCED`, and `COMPETITIVE` multipliers.

### Should export

- `getObjectiveMultipliers(objective: PairingObjective): ObjectiveMetricMultipliers`
- `applyObjectiveMultiplier(weight: number, multiplier: number): number`

### What it should do

- keep all objective behavior in one place
- avoid scattering objective logic across scorer code

## `lib/server/pairing/leftovers.ts`

### Responsibility

Handle room-count calculation and leftover speaker policy.

### Should export

- `computeRoomPlan(speakerCount: number): RoomPlan`
- `buildUnassignedParticipants(participants: SessionSpeaker[]): UnassignedParticipant[]`

### What it should do

- compute `floor(n / 8)` room count
- identify leftovers
- mark leftovers as `UNASSIGNED`
- prepare admin-facing leftover summary

## `lib/server/pairing/chair-assignment.ts`

### Responsibility

Handle chair scoring and room-wise allocation.

### Should export

- `computeChairAssignmentScore(input: ChairAssignmentInput): number`
- `assignChairsToRooms(input: ChairAllocationContext): ChairAllocationResult`

### What it should do

- calculate chair assignment score
- rank rooms by difficulty
- rank adjudicators by chair suitability
- assign stronger chairs to stronger rooms first

## `lib/server/pairing/metrics-loader.ts`

### Responsibility

Load metrics, adjustments, and active session inputs.

### Should export

- `loadPairingMetrics(sessionId: string): Promise<PairingMetricContext>`
- `loadSessionInputs(sessionId: string): Promise<SessionInputContext>`

### What it should do

- load DB-backed metric definitions
- load learned adjustments
- load objective mode
- load session-only constraints

## `lib/server/pairing/tuning.ts`

### Responsibility

Compute tuning suggestions after a batch of sessions.

### Should export

- `buildTuningReview(window: TuningWindowInput): Promise<TuningReviewResult>`
- `suggestMetricAdjustments(window: TuningWindowInput): Promise<MetricAdjustmentSuggestion[]>`

### What it should do

- compare proposal scores with admin ratings and outcomes
- suggest bounded metric adjustments
- preserve auditability

## `lib/server/pairing/review.ts`

### Responsibility

Own proposal review actions.

### Should export

- `approveProposal(proposalId: string, reviewerId: string): Promise<ProposalApprovalResult>`
- `overrideProposal(input: OverrideProposalInput): Promise<ProposalOverrideResult>`
- `regenerateProposal(input: RegenerateProposalInput): Promise<PairingProposalResult>`
- `rateProposal(input: RateProposalInput): Promise<ProposalRatingResult>`

### What it should do

- manage proposal state transitions
- save admin notes and ratings
- handle audit records

## `lib/server/pairing/publish.ts`

### Responsibility

Publish approved proposals and finalize attendance/session state.

### Should export

- `publishApprovedProposal(sessionId: string): Promise<PublishPairingResult>`
- `getPublishedPairing(sessionId: string): Promise<PublishedPairingView>`

### What it should do

- confirm approved proposal exists
- finalize attendance
- mark session as published/active
- persist official room assignments
- return published pairing view for member/cabinet/president access

## `lib/server/pairing/types.ts`

### Responsibility

Local pairing-only internal types.

### Should export

- internal candidate types
- scoring context types
- objective multiplier types
- fallback input/output types

## Session Module File Map

## `lib/server/sessions/session-service.ts`

### Should export

- `getSessionById(sessionId: string)`
- `updateSessionLifecycleState(input: UpdateSessionStateInput)`
- `getSessionPreparationContext(sessionId: string)`

### Responsibility

Own session lifecycle state changes and session-level fetches.

## `lib/server/sessions/attendance-service.ts`

### Should export

- `prepareAttendance(input: PrepareAttendanceInput)`
- `markAttendance(input: MarkAttendanceInput)`
- `finalizeAttendanceFromPublishedPairing(sessionId: string)`

### Responsibility

Own attendance preparation and publish-time attendance finalization.

## `lib/server/sessions/session-role-service.ts`

### Should export

- `assignSessionRole(input: AssignSessionRoleInput)`
- `getUserSessionRole(sessionId: string, userId: string)`

### Responsibility

Own speaker/adjudicator/chair session-role resolution.

## Scoring Module File Map

## `lib/server/scoring/speaker-scoring-service.ts`

### Should export

- `submitSpeakerScore(input: SubmitSpeakerScoreInput)`
- `submitSpeakerChairRating(input: SubmitSpeakerChairRatingInput)`

### Responsibility

Handle speaker-side post-session submissions.

## `lib/server/scoring/chair-scoring-service.ts`

### Should export

- `submitChairAdjudicatorScore(input: SubmitChairAdjudicatorScoreInput)`

### Responsibility

Handle chair-to-adjudicator scoring.

## `lib/server/scoring/leaderboard-service.ts`

### Should export

- `recomputeSpeakerLeaderboard()`
- `recomputeAdjudicatorLeaderboard()`
- `recomputeChairDerivedStats()`

### Responsibility

Update and derive leaderboard data from raw submissions.

## `lib/server/scoring/metric-update-service.ts`

### Should export

- `updateLearnedMetricsFromSession(sessionId: string)`
- `updatePairHistoryFromSession(sessionId: string)`
- `updateRolePerformanceFromSession(sessionId: string)`

### Responsibility

Convert post-session raw data into future pairing inputs.

## Eval Module File Map

## `lib/server/eval/harness.ts`

### Should export

- `runPairingEval(input: RunPairingEvalInput): Promise<EvalReport>`

### Responsibility

Main eval orchestrator.

## `lib/server/eval/replay-runner.ts`

### Should export

- `runHistoricalReplay(input: HistoricalReplayInput)`
- `runSyntheticReplay(input: SyntheticReplayInput)`

### Responsibility

Replay the engine against stored or synthetic scenarios.

## `lib/server/eval/regression-checker.ts`

### Should export

- `compareEvalReports(candidate: EvalReport, baseline: EvalReport): RegressionComparison`

### Responsibility

Detect whether a new rule set or formula set regressed.

## `lib/server/eval/report-builder.ts`

### Should export

- `buildEvalReport(input: EvalAggregationInput): EvalReport`

### Responsibility

Convert raw replay outputs into the final eval scorecard.

## `lib/server/eval/synthetic-scenarios.ts`

### Should export

- `getSyntheticPairingScenarios(): SyntheticPairingScenario[]`

### Responsibility

Store or generate the edge-case scenarios used by the eval harness.

## `lib/server/eval/types.ts`

### Responsibility

Local eval-only types.

## Repository File Map

These files should hide Prisma access from the domain services.

## `lib/server/repositories/pairing-repository.ts`

### Should export

- proposal reads and writes
- room/team assignment persistence
- review-log persistence
- proposal rating persistence
- published pairing read queries

## `lib/server/repositories/session-repository.ts`

### Should export

- session lookup
- attendance lookup/update
- session role lookup/update
- session state update

## `lib/server/repositories/scoring-repository.ts`

### Should export

- speaker score writes
- chair score writes
- leaderboard raw data reads
- metric-history reads/writes

## `lib/server/repositories/metrics-repository.ts`

### Should export

- metric definition lookup
- learned adjustment lookup
- adjustment history writes

## `lib/server/repositories/eval-repository.ts`

### Should export

- historical replay dataset loading
- stored baseline retrieval
- eval report persistence if needed later

## Validation File Map

## `lib/server/validations/pairing-validation.ts`

### Should export

- request validation for pairing routes
- manual override payload validation
- proposal rating payload validation

## `lib/server/validations/scoring-validation.ts`

### Should export

- speaker submission validation
- chair submission validation

## `lib/server/validations/session-validation.ts`

### Should export

- session-preparation payload validation
- attendance and session-input validation

## Shared Type File Map

## `types/pairing.ts`

### Should contain

- route-level request/response types for pairing endpoints
- proposal summary types
- review action payload types
- published pairing view types

## `types/session.ts`

### Should contain

- session preparation types
- attendance types
- session-role types

## `types/scoring.ts`

### Should contain

- speaker scoring payloads
- chair scoring payloads
- leaderboard DTOs

## `types/eval.ts`

### Should contain

- eval request payloads
- eval report types
- regression summary types

## API Route To Service Mapping

This is the most important integration view.

## Pairing Routes

### `app/api/pairing/generate/route.ts`

Should call:

- auth/guard layer restricting access to cabinet and president only
- `pairing-validation.ts`
- `generatePairingProposal()` from `lib/server/pairing/engine.ts`

### `app/api/pairing/proposal/[proposalId]/route.ts`

Should call:

- proposal fetch from `pairing-repository.ts`

### `app/api/pairing/proposal/[proposalId]/approve/route.ts`

Should call:

- `approveProposal()` from `lib/server/pairing/review.ts`

### `app/api/pairing/proposal/[proposalId]/override/route.ts`

Should call:

- `overrideProposal()` from `lib/server/pairing/review.ts`

### `app/api/pairing/proposal/[proposalId]/regenerate/route.ts`

Should call:

- `regenerateProposal()` from `lib/server/pairing/review.ts`

### `app/api/pairing/proposal/[proposalId]/rate/route.ts`

Should call:

- `rateProposal()` from `lib/server/pairing/review.ts`

### `app/api/pairing/publish/[sessionId]/route.ts`

Should call:

- `publishApprovedProposal()` from `lib/server/pairing/publish.ts`

### `app/api/pairing/published/[sessionId]/route.ts`

Should call:

- `getPublishedPairing()` from `lib/server/pairing/publish.ts`

## Session And Attendance Routes

### `app/api/attendance/prepare/route.ts`

Should call:

- `prepareAttendance()` from `lib/server/sessions/attendance-service.ts`

### `app/api/attendance/mark/route.ts`

Should call:

- `markAttendance()` from `lib/server/sessions/attendance-service.ts`

### `app/api/sessions/[sessionId]/route.ts`

Should call:

- `getSessionPreparationContext()` from `lib/server/sessions/session-service.ts`

## Scoring Routes

### `app/api/scoring/speaker/route.ts`

Should call:

- `submitSpeakerScore()`
- `submitSpeakerChairRating()`

Both from `lib/server/scoring/speaker-scoring-service.ts`

### `app/api/scoring/chair/route.ts`

Should call:

- `submitChairAdjudicatorScore()` from `lib/server/scoring/chair-scoring-service.ts`

## Eval Routes

### `app/api/eval/replay/route.ts`

Should call:

- `runPairingEval()` from `lib/server/eval/harness.ts`

### `app/api/eval/compare/route.ts`

Should call:

- `compareEvalReports()` from `lib/server/eval/regression-checker.ts`

## Existing Areas Likely To Be Replaced Or Reduced

Based on current planning, these older areas are likely to shrink, be replaced, or be removed later:

- attendance-linked manual pairing logic
- attendance-linked speaker scoring behavior
- anonymous feedback flow
- task assignment flow
- old session routes that assume manual or non-proposal pairing lifecycle

These should not be deleted blindly yet, but this map helps identify where the new system will take over.

## What Should Not Happen

To keep the backend maintainable, we should avoid these mistakes:

- putting pairing formulas directly inside route handlers
- keeping all business logic inside one giant service file
- mixing eval logic into runtime pairing files
- mixing attendance preparation logic with post-session scoring logic
- spreading Prisma queries everywhere without repository boundaries

## Recommended Implementation Order

If we follow this structure, the safest backend implementation sequence is:

1. confirm `12-backend-data-model-map.md` as the entity reference
2. confirm `13-pairing-learning-loop.md` as the learning/tuning design reference
3. confirm `14-api-routing-map.md` as the routing and access-control reference
4. create shared types
5. create repositories
6. create session and attendance services
7. create pairing engine internal modules
8. create review and publish services
9. add published pairing read service/route
10. create scoring services
11. create eval harness services
12. wire routes to services

## Summary

The clean backend architecture for this project is:

- thin API routes in `app/api`
- real domain logic in `lib/server`
- pairing engine isolated under `lib/server/pairing`
- post-session logic isolated under `lib/server/scoring`
- eval harness isolated under `lib/server/eval`
- Prisma access grouped in `lib/server/repositories`
- shared contracts in `types`

This gives the project a backend structure that can support the pairing engine, the review workflow, the scoring flow, published pairing visibility, and the adaptive evaluation system without turning the codebase into a tangle.
