# Pairing System Production Improvement Plan

## 1. Purpose

This document proposes production improvements to the implemented pairing system. It focuses on:

- strict, non-relaxable session constraints;
- higher pairing accuracy and candidate diversity;
- lower generation, publication, read, and realtime latency;
- database-enforced integrity and concurrency safety;
- reliable WebSocket/SSE delivery across single- and multi-instance deployments;
- understandable admin and participant UX;
- measurable production behavior and safe rollout.

The intended lifecycle remains:

```text
prepare attendance
  -> configure session and strict/soft constraints
  -> generate feasible candidates
  -> score valid candidates
  -> select from the top band
  -> admin review/override/approve
  -> atomic publication
  -> role-gated scoring
  -> metric updates
  -> evaluation and review-assisted tuning
```

## 2. Non-negotiable invariants

### 2.1 Strict constraints

A constraint marked `STRICT` is a feasibility requirement, not a score contribution.

```text
strict constraint violated
  -> reject partial branch or complete candidate
  -> never score the candidate
  -> never select the candidate
  -> never persist it as reviewable
  -> never approve or publish it
```

Strict constraints must never be silently downgraded because generation is slow or no candidate was
found. The engine must instead return one of these machine-readable outcomes:

- `STRICT_CONSTRAINT_CONFLICT` — the requested constraints contradict one another.
- `NO_FEASIBLE_ASSIGNMENT` — no valid complete proposal was found within the complete bounded search.
- `GENERATION_TIME_BUDGET_EXHAUSTED` — the budget ended before feasibility could be established.
- `INVALID_STRICT_CONSTRAINT` — a constraint references an unknown/ineligible participant or value.

The response should include safe structured details: constraint IDs/types, affected participant IDs,
and a human-readable remediation message. It must not expose private scoring details to members.

### 2.2 Validation points

Strict rules must be checked at five boundaries:

1. Request validation: shape, enum, participant existence, and duplicate constraint validation.
2. Pre-generation validation: contradictions and basic feasibility.
3. Candidate construction: prune invalid partial assignments as early as possible.
4. Pre-persistence validation: validate the selected complete candidate again.
5. Publish transaction validation: validate the approved proposal against the authoritative session
   inputs and rule version before making it official.

Manual overrides must pass the same validation as generated candidates. An admin may override soft
preferences but may not override core validity or a strict session constraint.

### 2.3 Authoritative lifecycle

- Exactly one official published proposal may exist per session.
- Member-visible reads use only the session's published proposal pointer.
- A generated draft must be recoverable from the backend across refreshes and devices.
- State-changing actions must reject stale proposal/session revisions.
- Realtime is a notification layer; HTTP/database state remains authoritative.

## 3. Current implementation summary

The engine currently:

1. loads a generation context;
2. checks room and adjudicator feasibility;
3. loads session inputs, metric definitions/adjustments, member snapshots, and pair snapshots;
4. creates up to 64 candidates within a 250 ms candidate-generation budget;
5. filters hard-rule violations;
6. deterministically scores valid candidates;
7. selects probabilistically from the top five;
8. persists audit metadata and assignments;
9. invalidates caches and publishes realtime events.

Strengths include bounded generation, front-loaded reads, deterministic scoring, top-band-only
randomness, review-before-publish, transaction-backed publication, role-aware scoring, and separated
generation/scoring/tuning/eval modules.

The principal weaknesses are limited candidate diversity, repeated context reads, missing database
invariants, incomplete optimistic locking, response-blocking Redis work, broad event-driven refetches,
and realtime connection lifecycle defects.

## 4. Accuracy architecture

### 4.1 Constraint-first bounded search

Replace rotation-dominated candidate creation with a bounded constraint-first search:

```text
validate and normalize constraints
  -> order participants by constraint degree
  -> construct several diverse feasible seeds
  -> mutate seeds with bounded local moves
  -> prune strict-rule violations immediately
  -> deduplicate canonical candidates
  -> score only complete valid candidates
```

Participant ordering should prioritize:

1. strict time constraints;
2. strict team-up or separation constraints;
3. strict role/position restrictions;
4. participants involved in multiple constraints;
5. unconstrained participants.

Suggested V1 search budget:

```text
MAX_CANDIDATES = 64
MAX_GENERATION_MS = 250
SEED_COUNT = 8
MUTATIONS_PER_SEED = 8
TOP_BAND_SIZE = 5
```

These are implementation guardrails, not permission to relax strict constraints. If the deadline is
reached, return a timeout result distinct from proven infeasibility.

### 4.2 Local mutation operators

Use bounded moves that preserve or quickly revalidate feasibility:

- swap two unconstrained speakers;
- swap speakers between teams;
- swap complete teams between rooms;
- swap speaking roles inside a team when role constraints allow it;
- move a forced pair as one atomic unit;
- swap chairs between rooms;
- redistribute non-chair panel adjudicators;
- create objective-specific variants from the same feasible seed.

Every mutation must be deterministic for a supplied seed. Randomness in candidate exploration may be
seeded for diversity, but validity and scoring must remain reproducible. Final proposal selection
continues to use the documented top-band probabilities.

### 4.3 Candidate deduplication and diversity

Create a canonical hash from sorted room/team/role/adjudicator assignments. Reject duplicate hashes
before scoring.

Record:

- candidates attempted;
- unique candidates generated;
- candidates rejected by each hard rule;
- candidate diversity ratio;
- unique teammate-pair count;
- unique role-assignment count;
- unique room-composition count.

Candidate count alone is not a quality measure.

### 4.4 Scoring improvements

Build constant-time maps in the prepared context:

```text
participantsById
memberMetricsByParticipantId
pairMetricsByPairKey
roleHistoryByParticipantId
motionHistoryByParticipantId
adjudicatorMetricsByParticipantId
```

Normalize active weights after learned adjustments and objective multipliers:

```text
raw_weight_i = max(0, base_weight_i + adjustment_i) * objective_multiplier_i
normalized_weight_i = raw_weight_i / sum(raw active weights)
```

Required aggregate weights must come from versioned configuration, not hardcoded values in the
engine.

### 4.5 Unknown data, confidence, and priors

Unknown data must not be treated as poor performance. Use documented fallback chains with neutral or
cohort priors:

```text
effective_metric = confidence * observed_metric + (1 - confidence) * fallback_or_prior
```

Recommended defaults, subject to authoritative formula approval:

- unknown pair dynamics -> neutral prior;
- unknown contextual speaker metric -> broad speaker metric;
- unknown role metric -> broad speaker metric;
- unknown chair metric -> adjudicator metric;
- unknown participant strength -> cohort baseline with low confidence.

Return proposal quality and evidence coverage separately. A proposal based mainly on fallbacks should
not appear equally trustworthy to one based on mature observations.

### 4.6 Recent form and uncertainty

Maintain recomputable snapshots rather than loading raw score history during generation:

- long-term performance;
- bounded recent-form EWMA;
- observation count;
- confidence/uncertainty;
- last-updated session/version.

Any new formula is forbidden until its status is finalized in the authoritative formula docs.

## 5. Database and concurrency improvements

### 5.1 Participant-reference integrity

For every `(memberId?, cabinetId?, presidentId?)` group, enforce exactly one non-null identity using
database checks where supported. Add participant/session uniqueness with partial unique indexes.

Apply equivalent constraints to attendance, session roles, speaker/adjudicator assignments,
unassigned participants, score records, metric snapshots, and pair snapshots.

### 5.2 Domain uniqueness

Add documented unique constraints for:

- proposal version within a session;
- room index within a proposal;
- participant assignment within a proposal;
- session role per participant/session;
- one score/feedback submission per role obligation;
- one metric snapshot per participant/metric/context;
- one canonical pair snapshot per pair/metric/context.

Database uniqueness must be the final idempotency defense. Read-before-write checks alone are not
sufficient under concurrency.

### 5.3 Optimistic locking

Add an authoritative revision or `updatedAt` contract to session and proposal mutations. Approve,
override, regenerate, and publish requests should carry the expected revision. Conditional writes
must return a structured stale-state conflict when no row matches.

### 5.4 Current draft recovery

Persist an authoritative current reviewable proposal reference or expose a documented repository read
that resolves it deterministically. Do not rely on React memory to preserve a generated proposal.

### 5.5 Transactional outbox

For authoritative mutations:

```text
database transaction
  -> mutate domain state
  -> insert outbox event
commit
  -> return HTTP response

worker
  -> invalidate cache
  -> publish realtime event
  -> mark outbox event delivered
```

This removes Redis/broker latency from the user-visible path while preserving reliable delivery.

## 6. Latency plan

### 6.1 Prepared generation context

Create one repository entry point that loads a consistent generation snapshot. Use a small set of
parallel projected queries inside a read transaction. Avoid reloading session rules, pair keys, or
metric data already returned by another context loader.

Target:

- one repository boundary;
- four to six deliberate database reads;
- no database query in candidate or scoring loops;
- no raw historical table scan on the generation path.

### 6.2 Cache invalidation

Replace broad tags with entity-scoped tags:

```text
session:{sessionId}
published:{sessionId}
scoring:{sessionId}
progress:{participantId}
leaderboard:{scope}
dashboard
```

Prefer direct key deletion or versioned namespaces to `SMEMBERS`-then-delete invalidation. Perform
cross-instance invalidation after the response through the outbox worker.

### 6.3 Query batching

Remove known N+1 patterns:

- batch progress summaries for the roster;
- batch legacy attendance peer resolution;
- batch participant-name lookup;
- paginate large participant/history lists;
- fetch detailed progress only on demand.

### 6.4 Initial latency budgets

| Path/stage | Initial p95 target |
|---|---:|
| Generation context load | 80 ms |
| Candidate construction | 100 ms |
| Validation and scoring | 60 ms |
| Proposal persistence | 70 ms |
| Generation response, warm | 300 ms |
| Generation response, cold | 600 ms |
| Publish response | 200 ms |
| Published pairing read, warm | 50 ms |
| Realtime event notification after commit | 250 ms |

Budgets must be verified in production-like infrastructure and adjusted based on evidence.

## 7. WebSocket and SSE improvement plan

### 7.1 Single connection record per transport

The SSE path must create one hub connection, not separate bootstrap and delivery records. A connection
without an event sink must not accumulate unread buffered events.

### 7.2 Bounded deduplication

Replace lifetime `Set<eventId>` storage with a bounded LRU or per-channel sequence tracking. Long-lived
connections must have stable memory usage.

### 7.3 Reconnection state machine

Implement:

```text
CONNECTING_WS
  -> OPEN_WS
  -> RETRY_WAIT
  -> CONNECTING_WS
  -> FALLBACK_SSE after bounded failures
  -> periodic WS recovery probe
```

Requirements:

- three-to-five-second handshake/bootstrap timeout;
- exponential backoff with jitter;
- pause retries while offline;
- reduce work in background tabs;
- reconnect and resubscribe after token/session changes;
- always perform an authoritative HTTP recovery fetch after reconnect.

### 7.4 Deployment topology

For a small deployment where events are server-to-client invalidations, SSE-only is a valid and often
simpler production choice. If WebSocket remains, explicitly support:

- graceful shutdown and connection draining;
- rolling restart reconnects;
- multi-instance Redis fan-out;
- topology health checks;
- startup validation when fan-out is required but disabled.

### 7.5 Event correctness

- Publish events using actual session IDs.
- Validate subscription scopes instead of silently casting unknown strings.
- Cap subscription counts and URL sizes.
- Include schema/event versions.
- Record local delivery, broker delivery, dropped delivery, and reconnect metrics.
- Do not expose admin-only proposal diagnostics in member-safe events.

### 7.6 Reduce refetch amplification

Events should identify the exact entity and version that changed. Clients should invalidate only the
affected query. Coalesce duplicate refreshes and retain stale UI while revalidating.

Avoid this pattern:

```text
one publish -> every connected client refetches entire dashboard -> global cache miss -> DB spike
```

## 8. UX requirements

Admin generation must show distinct states:

- validating constraints;
- building feasible assignments;
- evaluating proposals;
- saving proposal;
- proposal ready;
- constraints conflict;
- no feasible proposal;
- time budget exhausted;
- state changed by another admin.

The review UI should show:

- strict constraints satisfied;
- proposal quality;
- evidence coverage;
- top positive and negative score contributors;
- leftovers and reasons;
- candidate/top-band metadata appropriate for admins;
- differences from the previous proposal after regeneration;
- current authoritative revision.

Participant views must distinguish:

- not yet published;
- user absent;
- user present but unassigned;
- published assignment available;
- failed to load authoritative state.

## 9. Test fixtures

Fixtures must use deterministic participant IDs, metrics, rules, and seeds. Each fixture should be
serializable and usable by unit tests, integration tests, and eval replay.

### 9.1 Core feasibility fixtures

1. `one_room_minimal` — 8 speakers, 1 adjudicator.
2. `two_rooms_balanced` — 16 speakers, 3 adjudicators.
3. `leftover_speakers` — 19 speakers, valid two-room output plus 3 unassigned.
4. `insufficient_speakers` — fewer than 8 speakers.
5. `insufficient_adjudicators` — enough speakers but fewer adjudicators than rooms.

### 9.2 Strict-constraint fixtures

1. `strict_team_up_feasible` — forced pair must remain together.
2. `strict_team_up_with_early_role` — forced pair plus strict time constraint.
3. `multiple_strict_team_ups` — several atomic pairs across rooms.
4. `strict_constraint_conflict` — contradictory role/time/team requirements.
5. `strict_leftover_protection` — constrained participant must not be selected as leftover when a
   feasible alternative exists.
6. `strict_no_feasible_assignment` — contradiction proven within the bounded model.
7. `strict_timeout_unknown` — budget exhausts before infeasibility is proven.
8. `override_violates_strict_rule` — manual override rejected.
9. `publish_revalidation_failure` — approved proposal rejected after authoritative rule revision.
10. `rotation_misses_feasible_solution` — old rotation strategy fails, constraint-first search succeeds.

### 9.3 Scoring fixtures

1. mature metrics for all participants;
2. all-new participants using neutral priors;
3. mixed-confidence participants;
4. strong repeat-pair penalty;
5. motion-specific strength versus broad fallback;
6. development objective role rotation;
7. competitive objective strength preference;
8. equal scores with deterministic seeded selection;
9. weight normalization with disabled metrics;
10. candidate deduplication producing fewer unique than attempted candidates.

### 9.4 Concurrency fixtures

1. simultaneous generation for one session;
2. two admins approving different revisions;
3. override racing regeneration;
4. two publish requests;
5. duplicate speaker submission;
6. duplicate chair submission;
7. scoring request racing scoring closure.

These require real PostgreSQL connections, not only mocks.

### 9.5 Realtime fixtures

1. SSE connection creates exactly one hub record.
2. long-running connection keeps bounded dedupe memory.
3. WebSocket handshake timeout falls back to SSE.
4. WebSocket reconnects with exponential backoff.
5. WebSocket recovery closes fallback SSE cleanly.
6. reconnect triggers one coalesced HTTP recovery fetch.
7. Redis unavailable does not block mutation success.
8. multi-instance event reaches a connection on another instance.
9. malformed/unauthorized subscription is rejected.
10. proposal rating event uses the real session channel.
11. rolling restart reconnects without showing stale official state.
12. duplicate local-plus-broker event is delivered once.

### 9.6 Performance fixtures

Benchmark at minimum:

- 8, 16, 32, 64, and 128 speakers;
- 1, 2, 4, 8, and 16 rooms where feasible;
- sparse versus mature metrics;
- no constraints, moderate constraints, and dense strict constraints;
- warm cache, cold cache, Redis delayed, and Redis unavailable;
- 1, 50, 250, and 1,000 realtime connections.

## 10. Observability

Record structured timings and counts:

```text
request_id
session_id
engine_version
rule_version
metric_snapshot_version
context_load_ms
candidate_generation_ms
validation_ms
scoring_ms
selection_ms
persistence_ms
response_ms
outbox_delivery_ms
candidates_attempted
candidates_unique
candidates_valid
rejections_by_rule
selected_rank
selection_probability
constraint_count_by_type
realtime_transport
active_connections
reconnect_count
events_delivered
events_dropped
cache_hit_layer
```

Logs must minimize personal data. Use participant IDs only when necessary for debugging and apply
appropriate retention/access controls.

## 11. Rollout and rollback

1. Add fixtures, benchmarks, and instrumentation without behavior changes.
2. Fix realtime memory/delivery defects behind no feature flag where behavior is unambiguously wrong.
3. Add database constraints after auditing and repairing existing data.
4. Introduce the new generator behind a versioned feature flag.
5. Shadow-run old and new generators on the same context without publishing the shadow result.
6. Compare feasibility, strict-rule compliance, quality, diversity, and latency in eval.
7. Enable for admin review only on a small session cohort.
8. Keep publication manual.
9. Expand after regression thresholds pass.
10. Preserve engine/rule versions so rollback does not make historical proposals unreadable.

Rollback should select the previous engine version; it must never rewrite historical proposals or
metric evidence.

## 12. Definition of done

The improvement is production-ready only when:

- no strict-rule violation can reach persistence or publication;
- contradictory constraints return actionable structured errors;
- the new generator finds every feasible deterministic fixture;
- candidate diversity improves against the rotation baseline;
- all authoritative writes are concurrency-safe and idempotent;
- database participant identities and score obligations are constrained;
- SSE uses one bounded-memory connection record;
- WebSocket reconnect/fallback behavior is verified;
- multi-instance delivery is verified when supported;
- Redis failure does not add unbounded response latency;
- generation and publish p95 budgets pass under representative load;
- member views recover authoritatively after missed events;
- real PostgreSQL integration, concurrency, eval, and migration tests pass;
- the knowledge graph records actual paths, status, and verification evidence.

## 13. Proposed grounding

Grounded in: C2/S1-S8, C3/E1-E9, C4/M1-M18, C5/Fo1-Fo10, C6/L1-L5,
C7/D1-D19, C8/A1-A17, C9/B1-B12/B-rt, C10/V1-V5, C11/Q1-Q18;
`docs/04-pairing-engine-flow.md`, `docs/05-pairing-metrics.md`,
`docs/09-metric-formulas.md`, `docs/10-eval-harness.md`,
`docs/11-backend-implementation-map.md`, `docs/12-backend-data-model-map.md`,
`docs/13-pairing-learning-loop.md`, `docs/14-api-routing-map.md`,
`docs/15-pairing-engineering-quality-standard.md`, `docs/17-pairing-ui-concept.md`, and
`docs/17-websocket-realtime-flow.md`.

