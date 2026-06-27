# Pairing System Engineering Quality Standard

## Purpose

This document defines the engineering quality bar for the debate pairing system.

The pairing engine is not a side feature. It sits at the center of attendance, session lifecycle, scoring, role-based routing, leaderboards, adaptive learning, and publication visibility. Because of that, weak engineering here will create failures across the entire system.

This file should act as the implementation contract for anyone building or modifying the pairing system.

It defines:

- performance expectations
- scalability expectations
- database access discipline
- TypeScript quality rules
- engine architecture rules
- correctness and safety rules
- concurrency and consistency rules
- UX and latency expectations
- observability and debugging requirements
- testing, rollout, and evaluation standards

## Core Engineering Principle

The system must be designed so that it remains:

- correct under normal use
- understandable under maintenance
- fast under growth
- safe under bad input
- observable under failure
- predictable under tuning
- stable under concurrency

The goal is not just to make the engine work today.
The goal is to make sure this engine does not become the reason the platform becomes fragile later.

## 1. System Quality Goals

The pairing system should optimize for six things at the same time:

### 1. Correctness

If the engine produces invalid or contradictory pairings, every downstream feature breaks.

Correctness here means:

- no duplicated participant assignment
- no participant assigned to conflicting roles in the same session
- no invalid room structure
- no publication of an unreviewed or invalid proposal
- no mismatch between published pairing and visible pairing
- no role-routing mismatch after session completion
- no leaderboard updates from invalid or partial score submissions
- no stale proposal being acted on after a newer official state exists

### 2. Performance

The engine should feel responsive at current scale and remain efficient as data grows.

Performance here means:

- avoid repeated database round-trips during one generation request
- avoid recalculating the same metric repeatedly
- avoid loading unnecessary columns or rows
- avoid expensive nested loops where indexed lookups would work better
- keep generation bounded even when candidate count increases
- keep serialization and response payloads controlled

### 3. Scalability

The design must not silently degrade as more sessions, members, metrics, and pair histories accumulate.

Scalability here means:

- query shapes should remain stable as tables grow
- historical reads should use aggregation or precomputed snapshots where appropriate
- runtime work should grow in a controlled way, not explosively
- proposal generation should use bounded search, not unbounded combinatorics
- writes should not require table-wide scans or fragile uniqueness assumptions

### 4. Maintainability

This system will evolve over time. Metrics, weights, routing, and tuning will change.

Maintainability means:

- feature logic is modular
- formulas are centralized
- types are explicit
- state transitions are visible and auditable
- route handlers stay thin
- business rules are not duplicated across files
- the system can be changed without breaking audit trails or historical replay

### 5. Good UX Under Heavy Logic

Even if the system is mathematically strong, poor responsiveness or unclear states will make it feel broken.

UX quality here means:

- generation actions should return clear status
- long-running work should be observable by the frontend
- invalid session states should produce actionable errors
- published pairing should never lag behind official backend state
- user dashboards should show only relevant role-based actions
- duplicate clicks or repeated requests should not create confusing double effects

### 6. Operational Trust

Admins and members should be able to trust that the system is authoritative.

Operational trust means:

- official publication has one clear source of truth
- manual override is traceable
- tuning changes are reviewable
- production logs can explain what happened
- the system degrades safely when a dependency or rule path fails

## 2. Architecture Standard

The pairing system should follow strict separation of concerns.

### Route layer

Route handlers should only:

- authenticate user
- authorize access
- validate input
- call one service entry point
- shape response
- attach request-level tracing metadata

Route handlers must not contain:

- pairing formulas
- scoring formulas
- raw business decisions
- direct multi-step orchestration logic
- repeated Prisma logic

### Service layer

Services should own:

- pairing generation orchestration
- review flow
- publication flow
- score processing
- leaderboard update orchestration
- metric update orchestration
- tuning orchestration
- concurrency guards and idempotency handling for domain actions

### Repository layer

Repositories should own:

- data reads
- data writes
- transactional persistence
- query optimization
- explicit projection shapes
- locking or conflict-aware query helpers where needed

Repositories must not contain:

- business scoring logic
- route concerns
- UI response formatting

### Formula layer

Metric formulas and scoring functions should be centralized.

This is important because if formulas are spread across the codebase then:

- tuning becomes dangerous
- debugging becomes slow
- evaluation harnesses become unreliable
- small changes create invisible regressions

### Boundary rule

The engine must not read raw request payload shape directly in deep logic.

Instead:

- route validation converts request payload into domain input
- service orchestration converts domain input into generation context
- engine code works only on trusted internal types

This protects the engine from schema drift and inconsistent parsing behavior.

## 3. Pairing Engine Design Rules

The engine must be designed as a bounded search and scoring system, not as a naive brute-force enumerator.

### Required engine characteristics

- candidate generation must be bounded
- hard-rule filtering must happen early
- expensive computations must be reused
- score computation must be deterministic for a fixed candidate and fixed input context
- probabilistic final selection must happen only after scoring
- final persistence must capture why the selected candidate was chosen

### Required engine stages

1. load session context once
2. load historical metric context once
3. precompute reusable lookup maps
4. build valid candidates through constrained generation
5. reject invalid candidates early
6. score valid candidates
7. keep top band only
8. probabilistically select from that band
9. persist proposal with score explanation and generation metadata

### Must not do

- load database data inside inner candidate loops
- compute the same pair metric repeatedly from raw history in scoring loops
- mix hard-rule validation and soft-score aggregation in one unreadable function
- let randomness affect validity checks
- let randomness affect auditability
- let fallback logic silently bypass hard rules

### Engine safety rule

If the engine cannot produce a valid proposal, it must fail explicitly with machine-readable reasons.

It must not:

- produce a low-quality but invalid proposal just to return something
- silently drop participants without recording why
- publish a partial state

## 4. Time Complexity And Search Discipline

The biggest hidden risk in a pairing engine is combinatorial explosion.

If the code tries to explore too many possible combinations without strong pruning, it will become slow very quickly.

### Required design direction

The engine should use:

- constrained candidate generation
- early invalidation
- heuristic pruning
- top-band retention
- reusable cached metric maps
- fixed upper bounds on explored candidates per request

### Practical guidance

Use arrays only where iteration is the right tool.
Use maps or objects when repeated lookup is needed.
Use sets when fast membership checks matter.

Examples:

- use `Map<MemberId, MemberMetricSnapshot>` for per-member lookup
- use `Map<PairKey, PairMetricSnapshot>` for pair dynamics lookup
- use `Set<MemberId>` to guard duplicate assignment
- use indexed room structures rather than repeatedly scanning entire candidate trees

### Complexity expectations

The runtime should aim for:

- one-time data loading cost near the start of generation
- mostly in-memory scoring during candidate evaluation
- no query complexity proportional to number of candidates
- no nested repeated scans over full historical tables during scoring
- no quadratic rework when a small lookup table would solve it

In simple terms:

- database cost should be mostly front-loaded
- candidate cost should be mostly in-memory
- final persistence cost should be one transaction

### Non-negotiable protection

The implementation should define explicit guardrails such as:

- max candidate count explored per generation request
- max time budget for synchronous generation
- max size of top band retained in memory

These values may evolve, but the existence of the limits must be enforced from V1.

## 5. Latency And Throughput Budgets

The previous sections describe performance direction. This section closes a loophole by requiring real budgets.

Without explicit budgets, code can remain "theoretically optimized" while still feeling slow.

### V1 target direction

- normal generation should complete within a bounded interactive window
- p95 generation latency should remain acceptable for admin workflow
- publish actions should complete fast enough to feel atomic
- post-session score submission should feel immediate
- published pairing read should be fast and stable because it is a fan-out read path

### Engineering rule

Every critical path should have a measurable latency target, even if the exact numbers are tuned later.

At minimum track:

- average latency
- p95 latency
- timeout count
- retry count
- request cancellation count where applicable

### Design consequence

If synchronous generation cannot stay within the chosen interactive budget, the system should move that flow to an asynchronous job model instead of silently getting slower.

## 6. Database Access Standard

The pairing system must be extremely disciplined about database access.

### Golden rule

For one pairing generation request, the backend should gather the required context in a small number of deliberate reads, not by querying throughout the algorithm.

### Required practices

- batch-load required session participants
- batch-load required member metric snapshots
- batch-load required pair metric snapshots
- batch-load required position history summaries
- batch-load required adjudicator and chair summaries
- project only required fields
- use transactions for publish and multi-step writes
- persist summary snapshots where they materially reduce repeated expensive reads

### Anti-patterns to avoid

- N+1 member metric queries
- N+1 pair history queries
- loading full session history when only aggregated summary is required
- loading all raw scores when snapshot aggregates are enough
- querying inside score calculators
- over-fetching wide JSON payloads when only a few fields are needed

### Query design expectation

The repository layer should expose methods like:

- `getGenerationContext(sessionId)`
- `getMemberMetricSnapshots(memberIds)`
- `getPairMetricSnapshots(pairKeys)`
- `getRoomAssignmentSummary(sessionId)`
- `publishProposalTransaction(input)`

The exact names can differ, but the design principle must remain.

### Indexing rule

Any field used regularly for:

- session scoping
- published proposal lookup
- proposal status lookup
- member-session role lookup
- pair metric lookup
- score uniqueness checks
- review timeline retrieval

should be explicitly reviewed for indexing.

A pairing engine can become slow even with clean TypeScript if the data access path is not indexed correctly.

## 7. Data Shape And Precomputation Standard

Raw tables should not be treated as the runtime API of the engine.

The engine should consume pre-shaped context objects that are optimized for runtime use.

### Example context structure

```ts
interface PairingGenerationContext {
  session: SessionGenerationInfo;
  participants: ParticipantContext[];
  memberMetricsById: Map<MemberId, MemberMetricSnapshot>;
  pairMetricsByKey: Map<PairKey, PairMetricSnapshot>;
  roleHistoryByMemberId: Map<MemberId, RoleHistorySummary>;
  motionTypeHistoryByMemberId: Map<MemberId, MotionTypeSummary>;
  adjudicatorMetricsById: Map<MemberId, AdjudicatorMetricSnapshot>;
  rules: ActivePairingRules;
}
```

The purpose of this pattern is simple:

- one clean loading phase
- one clean scoring phase
- no hidden dependency on live query calls later

### Snapshot rule

When historical aggregation is expensive and reused often, the system should prefer stored summary snapshots over repeatedly recomputing from raw event tables.

But snapshot usage must obey two rules:

- the refresh/update ownership must be explicit
- raw source data must remain available for audit or rebuild

## 8. TypeScript Quality Standard

Because this feature is logic-heavy, TypeScript quality matters a lot.

Loose typing here will create silent failures.

### Required rules

- avoid `any`
- avoid untyped JSON blobs in core engine code
- define explicit input and output types for every service boundary
- define explicit domain types for proposal state, session role, motion type, pairing objective, and score payloads
- use discriminated unions when state shape changes by mode
- keep nullability explicit
- do not rely on implicit optional fields for important state
- avoid stringly-typed status comparisons scattered across modules

### Where enums are useful

Use enums or `as const` domain constants for stable finite values such as:

- proposal status
- session role
- pairing objective
- motion type if the set is controlled
- review action type
- score submission type
- leftover reason type
- tuning mode

### Where alias types are useful

Use type aliases for:

- ids such as `MemberId`, `SessionId`, `ProposalId`
- score units
- probability values
- metric keys
- pair keys
- room ids within in-memory generation

### Preferred style

- use interfaces for structured domain payloads
- use unions for state transitions
- use branded or aliased ids where helpful
- avoid passing huge anonymous object literals between modules
- prefer pure helper functions for score calculation where state mutation is unnecessary

### Numeric safety rule

Weighted scoring and probability logic should be careful about numeric stability.

At minimum:

- normalize probability inputs deliberately
- clamp values into expected ranges where appropriate
- avoid hidden divide-by-zero cases
- make fallback behavior explicit when observation count is zero
- keep score precision consistent across runtime, persistence, and eval outputs

## 9. State Machine Discipline

This feature has a real lifecycle and should be treated like one.

Important states include:

- session preparation
- proposal generated
- proposal approved
- proposal overridden
- proposal published
- session active
- session completed
- scoring completed

### Required rule

State transitions should be explicit and validated.

Examples:

- do not allow publish before approval
- do not allow speaker score submission before publication and session completion window
- do not allow a second published proposal without resolving the current official state
- do not allow dashboard routing based on stale role assignment data
- do not allow scoring submissions against outdated session-role assignments

### Recommended design

Use explicit transition guards or state-check helpers instead of scattered inline conditionals.

### Versioning rule

State-changing actions should defend against stale writes.

Examples:

- proposal actions should validate current proposal version or updated timestamp
- publish should confirm the approved proposal is still the current intended proposal
- manual override should not silently replace a proposal that has changed since the UI loaded it

This closes the race-condition loophole where two admins act on slightly different state views.

## 10. Concurrency, Idempotency, And Conflict Control

This is one of the most important loopholes to close.

A good system can still break if two requests happen at nearly the same time.

### Risks to protect against

- two admins generating proposals for the same session simultaneously
- two publish requests racing
- repeated button clicks creating duplicate actions
- duplicate score submissions from retries or refreshes
- manual override conflicting with regenerate or publish

### Required protections

- critical state-changing actions should be idempotent where possible
- publish must be guarded so only one official published result can win
- duplicate submissions should return safe repeatable outcomes, not corrupt state
- conflict responses should be explicit and machine-readable
- transactions or optimistic locking must protect final authoritative writes

### Recommended examples

- use request id or idempotency key for publish and score submissions where practical
- use unique constraints for one-off actions that must not duplicate
- use row version or `updatedAt` conflict checks for stale admin actions
- use transactional verification before writing official publish state

## 11. Randomness, Auditability, And Reproducibility

This engine is probabilistic, but probabilistic must not mean opaque.

### Requirements

- randomness should happen only in final proposal selection from the top band
- candidate validity must be deterministic
- score calculation for a candidate must be deterministic
- the selected random path should be traceable through stored metadata
- proposal persistence should include enough context to explain why this proposal was eligible and selected

### Recommended data to store

- engine version
- rule version
- metric snapshot version
- candidate score summary
- top-band rank
- final selection probability
- random seed or equivalent reproducibility token where practical
- objective mode used for the generation

Without this, debugging and evaluation will become guesswork.

### Manual override audit rule

Manual override should not destroy the original engine output.

If admins override a proposal, the system should preserve:

- original generated proposal context
- override actor
- override reason or notes
- overridden fields or assignments
- final official published result

This is necessary both for trust and for future evaluation.

## 12. Caching And Reuse Rules

Not every cache is useful. Wrong caching creates stale logic bugs.

### Good candidates for short-lived in-request reuse

- member metric lookups
- pair metric lookups
- motion-type-specific metric lookups
- normalized role history summaries
- active rules object

### Be careful with cross-request caching

Cross-request caching should be used only if invalidation is clear.

For example:

- active rules config may be cached briefly with invalidation on update
- static reference data may be cached
- live session state should not be cached loosely
- publication state should not rely on stale cache
- authorization and role-routing reads should not rely on stale cached assumptions

### Safe default

Prefer request-scoped precomputation over broad long-lived caches for V1.

## 13. Transaction And Consistency Rules

Publication and score processing must be consistent.

### Use transactions when

- publishing a proposal changes multiple tables
- attendance finalization depends on publication
- official published proposal pointer is updated
- post-session scoring updates summary tables and snapshots
- tuning writes create multiple related records
- manual override applies several related assignment changes

### Important consistency rule

The published pairing must have one official source of truth.

That means:

- one official published proposal per session
- one explicit published pointer on session or equivalent authoritative link
- published read endpoint must read from that official source
- non-official proposals must never be mistaken for published truth in frontend reads

### Recovery rule

If a multi-step critical action fails mid-flight, the system must leave the database in one of two states only:

- fully committed authoritative state
- fully rolled back pre-action state

Never allow partially published or partially scored official state.

## 14. Config, Rule, And Schema Governance

Another hidden loophole is assuming the code is safe while the configuration is not.

The pairing system depends on rules, weights, metric metadata, and schema assumptions.

### Required protections

- rule configuration must be validated before activation
- impossible or contradictory rule combinations must be rejected early
- weight ranges should be bounded and checked
- missing metric dependencies should fail validation
- schema migrations must preserve replayability and published historical records

### Versioning expectations

The system should preserve version references for:

- engine logic version
- rules version
- metric snapshot version
- migration-sensitive historical proposal records where needed

### Migration rule

A schema change must not make old published proposals unreadable or old eval runs uninterpretable.

Historical artifacts are part of the system contract.

## 15. Error Handling Standard

When this system fails, the user should understand why.

### Good backend errors should distinguish between

- validation failure
- authorization failure
- impossible session state
- insufficient participants
- insufficient adjudicators
- no valid proposal found
- stale proposal action
- duplicate submission
- publication conflict
- timeout or overloaded generation path
- configuration validation failure

### Error responses should be

- explicit
- stable in shape
- safe to expose
- actionable for frontend behavior

Bad error quality here will make admins distrust the engine.

### Degraded-mode rule

If a non-critical helper path fails, the system should degrade in a known way rather than corrupting state.

Examples:

- generation may fail cleanly without changing session state
- publish must not degrade into partial success
- optional analytics/logging failure must not block authoritative writes

## 16. Security And Privacy Standard

This document was previously too weak here.

Even though this is not a payments system, it still handles sensitive society data and privileged actions.

### Security expectations

- generation, review, override, and publish routes must enforce role authorization strictly
- member-visible published pairing reads must not expose admin-only review context
- score submission routes must enforce session-role ownership strictly
- rule update or tuning administration should be restricted carefully
- internal diagnostics should not leak hidden scoring or admin notes to general members

### Privacy expectations

- logs should avoid unnecessary personal detail
- admin review notes should be access-controlled
- proposal diagnostics returned to the frontend should be role-appropriate
- stored metadata should be minimized to what is needed for audit and debugging

### Scoring oversight vs. submission content (completion ≠ content)

- post-session scoring **completion tracking** (who has/hasn't submitted the form for their
  session role) is oversight data, readable by cabinet, president, and techhead so they can
  monitor progress and chase missing submissions
- the **content** of a submission (the actual scores/ratings a participant gave) is restricted —
  it is not browsable by other participants, and oversight roles see completion + identity only,
  not the values others entered; the public derived output is the leaderboards
- acting on the scoring cycle (nudge, close scoring) is limited to cabinet and president;
  techhead oversight is read-only

## 17. Observability And Debugging Standard

This feature must be inspectable in production-like conditions.

### Required logging and tracing areas

- generation request start and end
- generation duration
- candidate count generated
- candidate count rejected by hard rules
- top-band size
- selected proposal id
- publish transition success or failure
- score submission acceptance or rejection
- tuning run execution
- conflict or stale-write rejection
- timeout or cancellation behavior

### Important rule

Logs should explain decisions without leaking unnecessary personal or sensitive detail.

### Recommended metrics

- average generation latency
- p95 generation latency
- publish latency
- score-processing latency
- invalid generation attempt count
- no-valid-proposal count
- stale action rejection count
- duplicate submission suppression count
- publish conflict count
- generation timeout count

### Alerting rule

A critical workflow should page or alert when certain thresholds are crossed repeatedly.

Examples:

- publish failures
- generation timeout spikes
- repeated no-valid-proposal spikes
- repeated stale-write conflicts after release

## 18. Testing Standard

This feature requires more than route-level tests.

### Required test layers

- unit tests for formulas and transition guards
- service tests for generation flow and publication flow
- repository tests for critical query behavior
- integration tests for role-based scoring and published visibility
- concurrency tests for generate and publish conflicts
- eval replay tests for tuning safety and regression checks
- migration safety tests for historical readability where feasible

### Must-have unit coverage

- confidence fallback behavior
- top-band probabilistic selection input preparation
- room-balance calculation
- speaker-strength calculation
- leftover handling
- state transition guards
- probability normalization and zero-observation fallback behavior

### Must-have integration coverage

- cabinet or president can generate and publish
- member cannot generate or publish
- member can read published pairing after publication
- speaker sees correct post-session scoring route based on session role
- published attendance state matches official proposal
- double publish attempts do not create conflicting official results
- duplicate score submissions do not corrupt aggregates

### Must-have failure coverage

- invalid rule config is rejected
- stale proposal action is rejected
- generation timeout path returns safe failure
- partial critical write is rolled back

## 19. Eval Harness As Engineering Safety Net

The eval harness is not optional decoration.
It is part of code quality for this feature.

Any important engine change should be reviewable against replay scenarios before release.

### It should protect against

- degraded room balance
- excessive repeat pairing
- incorrect fallback behavior
- unstable tuning behavior
- regressions hidden by randomness
- metric-weight changes that improve one narrow case while harming overall session quality

### Engineering rule

If a change affects pairing scores, candidate generation, tuning logic, or fallback weighting, it should be evaluated through the harness before being trusted.

### Rollout rule

Eval success alone is not enough for risky changes.

High-impact engine changes should also have:

- explicit rollout note
- version tracking
- ability to compare before and after behavior
- ability to roll back to the previous rules or engine version

## 20. UX Performance Expectations

The frontend experience depends heavily on backend behavior.

### Expectations

- generation should return quickly enough to feel intentional, not frozen
- if generation takes longer, progress state must be visible
- publication should feel atomic
- published pairing should appear immediately after successful publish
- dashboards should load only the relevant role-based scoring tasks
- admins should receive clear feedback when generation fails due to rules or participant structure
- retryable failures should be distinguished from terminal failures

### Important UX rule

Never make the user guess whether the engine is still working, failed, or published stale data.

### UI contract rule

The backend should provide the frontend enough structured information to render:

- current lifecycle state
- whether an action is retryable
- whether the user is stale and should refresh
- whether a request was accepted but is still processing
- whether a conflict occurred because another admin already acted

## 21. Context Discipline For AI-Assisted Development

This project will likely involve AI-assisted coding and planning, so context discipline matters.

Large context often causes the middle of the specification to be forgotten or inconsistently applied.

### Required working method

When implementing this system, developers or coding agents should not rely on one giant prompt or one giant file.

Instead, implementation should be grounded in focused reference files:

- overview and product intent from `01-overview.md`
- backend behavior from `02-backend-changes.md`
- database design from `03-database-design.md`
- engine logic from `04-pairing-engine-flow.md`
- metric definitions from `05-pairing-metrics.md`
- formulas from `09-metric-formulas.md`
- eval expectations from `10-eval-harness.md`
- implementation map from `11-backend-implementation-map.md`
- model naming from `12-backend-data-model-map.md`
- learning behavior from `13-pairing-learning-loop.md`
- API contracts from `14-api-routing-map.md`

### Practical rule

Any implementation task should reference the smallest relevant subset of docs, not the entire docs folder every time.

This reduces:

- missed constraints
- inconsistent naming
- accidental drift
- partial understanding of rules hidden in the middle of long context

### Context safety rule

If a work item touches multiple concerns, the implementation task should explicitly list which source docs govern it.

This prevents the common failure mode where one constraint is remembered and another is forgotten.

## 22. Review Checklist For Every Meaningful Code Change

Before accepting a change in this system, ask:

1. Does it reduce or accidentally increase query count?
2. Does it move any database read into an inner loop?
3. Does it introduce duplicated business logic?
4. Does it weaken type safety?
5. Does it make state transitions less explicit?
6. Does it break auditability of probabilistic selection?
7. Does it increase candidate explosion risk?
8. Does it make published pairing less authoritative?
9. Does it hurt role-based routing correctness?
10. Does it make future tuning harder to evaluate?
11. Does it keep frontend feedback clear and immediate?
12. Does it create a race condition or stale-write risk?
13. Does it weaken rollback or recovery behavior?
14. Does it create config drift or migration risk?
15. Does it leak internal review or scoring detail to the wrong audience?

If the answer is uncertain, the change is not ready.

## 23. Final Standard

The quality bar for this feature should be:

- clear architecture
- bounded algorithm design
- low query count per operation
- strong type safety
- explicit lifecycle transitions
- concurrency safety
- idempotent critical actions
- auditability of engine decisions
- scalable metric access patterns
- safe post-session routing
- predictable publication behavior
- measurable performance
- rollback-safe writes
- secure role-aware data exposure
- test-backed confidence

The pairing system should be built like infrastructure, not like a convenience feature.
That is the right standard because if this feature becomes unreliable, the rest of the debate workflow becomes unreliable with it.