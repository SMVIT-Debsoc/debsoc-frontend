# Codex Prompt — Pairing Accuracy, Strict Constraints, Realtime, and Latency

Copy this prompt into a new Codex task when implementation is authorized. Execute one phase at a
time. Do not combine phases unless the user explicitly asks.

---

You are improving the production pairing system in this repository. Work as a senior staff engineer
responsible for correctness, database integrity, algorithm quality, latency, realtime reliability,
observability, migration safety, and UX.

## Mandatory protocol

1. Read `AGENTS.md` completely.
2. Read `docs/pairing-knowledge-graph.md` completely.
3. Identify the exact communities and nodes touched.
4. Declare Mode A or Mode B before planning. Most engine/database/realtime service work is Mode A;
   client realtime UX is the minimum necessary Mode B integration.
5. Read only the governing numbered documents cited by those nodes, plus the relevant sections of
   `docs/15-pairing-engineering-quality-standard.md`.
6. Read the relevant installed Next 16 documentation under `node_modules/next/dist/docs/` before
   changing route handlers, caching, streaming, custom-server, or post-response behavior.
7. Inspect the installed Prisma 7 schema/client behavior before migrations or transaction changes.
8. Never invent a route, field, enum, formula, weight, status, or access rule.
9. If an authoritative document conflicts with code or another authoritative document, stop and ask.
10. Do not implement a formula whose status is open.
11. Preserve existing migrations and historical published proposal readability.
12. Use repositories for all Prisma access and keep routes transport-only.
13. Update `docs/pairing-knowledge-graph.md` only after the phase's done-when checks pass.

Read `docs/improvements/pairing-production-improvement-plan.md` after the mandatory graph and scope
steps. Treat it as a proposal subordinate to the numbered authoritative docs.

## Global behavior requirement

Strict constraints are non-negotiable. A strict constraint violation must never be compensated by a
high soft score and must never reach persistence, approval, or publication.

```text
STRICT violation -> reject/prune -> never score -> never select -> never publish
```

Distinguish:

- contradictory constraints;
- proven infeasibility;
- invalid constraint input;
- time-budget exhaustion before feasibility is known.

Do not silently relax strict constraints.

## Working rules

- Begin each phase with a short plan and the exact files expected to change.
- Preserve unrelated user changes in the worktree.
- Use `apply_patch` for edits.
- Add tests before or alongside behavioral changes.
- Run the narrowest relevant tests after each logical edit.
- Do not claim migration correctness without testing against a disposable PostgreSQL database.
- Do not claim concurrency correctness using mocks alone.
- Do not optimize without recording before/after measurements.
- Keep randomness seeded and auditable.
- Keep candidate generation bounded.
- Never query the database inside candidate/scoring loops.
- Realtime delivery failure must not corrupt or roll back committed domain state.
- HTTP/database reads remain the recovery source of truth after reconnect.

## Phase 0 — Baseline and fixtures

Objective: create deterministic coverage and performance baselines without changing production
behavior.

Deliverables:

1. Add reusable deterministic fixture builders for participants, roles, metrics, pairs, rooms,
   rules, and seeds.
2. Add fixtures listed in `docs/improvements/pairing-production-improvement-plan.md` section 9.
3. Add baseline tests for current strict-rule behavior.
4. Add benchmark instrumentation for generation stages.
5. Record current query count, candidate count, unique candidate count, valid count, and timing.
6. Add a report comparing 8/16/32/64/128 speaker scenarios.

Do not alter formula weights or generation behavior in this phase.

Done when:

- fixtures are deterministic;
- existing tests still pass;
- benchmark output is reproducible;
- the baseline identifies rotation duplicates and latency stage costs;
- TypeScript passes.

## Phase 1 — Strict-constraint correctness

Objective: make strict constraints correct at every boundary.

Deliverables:

1. Add normalized internal constraint types using only documented rule identifiers.
2. Validate participant existence, eligibility, duplicates, and contradictions.
3. Add a feasibility pre-check that returns typed domain errors.
4. Ensure strict rules prune candidate construction early.
5. Revalidate the selected candidate before persistence.
6. Validate manual overrides against authoritative strict rules.
7. Revalidate the approved proposal inside the publish transaction using rule/version state.
8. Return stable, machine-readable error codes and safe remediation details.

Required fixtures:

- `strict_team_up_feasible`;
- `strict_team_up_with_early_role`;
- `multiple_strict_team_ups`;
- `strict_constraint_conflict`;
- `strict_leftover_protection`;
- `strict_no_feasible_assignment`;
- `strict_timeout_unknown`;
- `override_violates_strict_rule`;
- `publish_revalidation_failure`.

Done when:

- every strict fixture behaves exactly as specified;
- no strict violation is scored or persisted;
- infeasible and timeout outcomes are distinct;
- manual override and publish revalidation tests pass;
- routes remain transport-only.

## Phase 2 — Database integrity and concurrency

Objective: enforce pairing invariants in PostgreSQL and make authoritative actions concurrency-safe.

Before editing, audit existing data and migrations. Produce a migration plan and stop if dirty data
would make constraints unsafe.

Deliverables, only where authoritative docs permit:

1. Exactly-one participant-reference constraints.
2. Partial unique indexes for participant/session obligations.
3. Proposal version, room index, score obligation, and metric snapshot uniqueness.
4. Revision/optimistic-locking support for review mutations.
5. Authoritative current-review-proposal recovery.
6. Stable conflict mapping for concurrent actions.
7. Real PostgreSQL tests for approve/override/regenerate/publish and duplicate scoring races.

Done when:

- migrations apply to an existing-data fixture and a clean database;
- migrations roll back where rollback is supported/tested;
- simultaneous requests produce one authoritative result;
- duplicate retries return idempotent outcomes;
- historical published reads remain valid.

## Phase 3 — Realtime correctness

Objective: eliminate connection leaks, missed events, and unstable fallback behavior.

Deliverables:

1. Make SSE create exactly one hub connection record.
2. Remove unread/unbounded buffered event accumulation.
3. Replace lifetime event-ID sets with bounded dedupe.
4. Validate subscription scopes and cap subscription counts.
5. Fix events published with non-session channel identifiers.
6. Add WebSocket handshake/bootstrap timeout.
7. Add exponential reconnect with jitter.
8. Fall back to SSE after bounded failures and periodically probe WebSocket recovery.
9. Ensure fallback SSE closes when WebSocket recovery succeeds.
10. Trigger one coalesced authoritative HTTP recovery fetch after reconnect.
11. Verify local-plus-Redis duplicate delivery is emitted once.
12. Add graceful shutdown/connection draining if the custom server remains.

Required realtime fixtures are listed in improvement-plan section 9.5.

Done when:

- connection count matches browser connection count;
- memory remains bounded in a long-running connection test;
- reconnect/fallback/recovery tests pass;
- multi-instance delivery passes when fan-out is enabled;
- Redis failure does not break committed mutations;
- member/admin event filtering remains correct.

## Phase 4 — Mutation-path latency

Objective: remove cache and broker latency from successful user-facing mutations without losing
delivery reliability.

Deliverables:

1. Design and implement a transactional outbox if permitted by authoritative docs; if a new model is
   not documented, stop and request approval before inventing it.
2. Persist domain state and event intent atomically.
3. Return the HTTP response after commit, not after Redis publication.
4. Deliver cache invalidation and realtime events asynchronously.
5. Add retry, dead-letter/terminal failure, and delivery observability.
6. Replace broad cache invalidation with entity-scoped invalidation.
7. Verify event-driven reads cannot repopulate stale cache before invalidation.

If an outbox cannot be introduced under current docs, propose the smallest documented alternative and
stop for approval rather than silently using an unreliable fire-and-forget promise.

Done when:

- committed mutations return within the target budget when Redis is slow/unavailable;
- events are eventually delivered after transient failure;
- retries do not duplicate user-visible events;
- authoritative HTTP recovery remains correct.

## Phase 5 — Prepared context and scoring efficiency

Objective: reduce database work and inner-loop CPU cost without changing formulas.

Deliverables:

1. One repository-level prepared generation context boundary.
2. Consistent read snapshot for session/rules/metrics.
3. No duplicate session, rule, member metric, or pair metric loads.
4. `participantsById` and other required lookup maps.
5. No array participant lookup inside scoring loops.
6. Required metric weights loaded from versioned configuration.
7. Normalize active weights only if this matches the authoritative formulas; otherwise stop and ask.
8. Add query-count assertions and CPU benchmarks.

Done when:

- generation issues a bounded documented number of queries;
- scoring has no database calls;
- output is identical to the baseline for fixed fixtures unless an authorized formula/config fix says
  otherwise;
- context and scoring stages meet their p95 budgets.

## Phase 6 — Candidate diversity and accuracy

Objective: improve the best feasible proposal found within the existing bounded budget.

Deliverables:

1. Canonical candidate hashing and deduplication.
2. Constraint-degree participant ordering.
3. Multiple deterministic diverse seeds.
4. Bounded local mutation operators.
5. Early hard-rule pruning.
6. Diversity metrics and audit output.
7. Shadow comparison against the rotation baseline.
8. Eval regression thresholds for feasibility, quality, diversity, and latency.

Do not change top-band probabilities or formulas unless separately authorized by their governing docs.

Required fixture:

- `rotation_misses_feasible_solution`, where the old strategy fails and the new bounded search finds a
  valid assignment while satisfying every strict rule.

Done when:

- deterministic fixtures are reproducible by seed;
- strict compliance remains 100%;
- unique-candidate/diversity metrics improve;
- quality improves or remains within accepted regression thresholds;
- latency stays within the bounded target;
- eval comparison passes.

## Phase 7 — Read/refetch latency and UX

Objective: minimize read amplification and make state/error semantics clear.

Deliverables:

1. Batch progress summaries and legacy attendance peer reads.
2. Narrow realtime invalidation to affected entities.
3. Coalesce client refreshes.
4. Preserve stale visible data during background revalidation.
5. Distinguish not-published, absent, unassigned, unauthorized, unavailable, and stale-conflict states.
6. Display strict-constraint validation, proposal quality, evidence coverage, and relevant score
   explanations to admins without leaking private diagnostics to members.
7. Show all pending scoring obligations rather than only the newest session.

Done when:

- one event does not create a global dashboard/database stampede;
- frontend error states are semantically correct;
- accessibility and mobile alternatives are verified;
- member-visible data remains sourced only from the official published proposal.

## Phase 8 — Production verification and rollout

Objective: prove safety under realistic load and deploy incrementally.

Deliverables:

1. Real PostgreSQL migration, integration, and concurrency suite.
2. Generation load suite for documented participant sizes.
3. Realtime load suite for 1/50/250/1,000 connections.
4. Redis latency and outage tests.
5. Multi-instance fan-out test.
6. Shadow old/new generator evaluation.
7. Feature flag and rollback procedure preserving engine/rule versions.
8. Production dashboards and alerts for latency, constraint conflicts, no-feasible outcomes, event
   delivery, reconnects, cache behavior, and database saturation.

Done when:

- all `docs/15` section 22 checks pass;
- p95 budgets are achieved or explicitly revised from measured evidence;
- no reportable correctness or privacy regression remains;
- rollout and rollback have been exercised;
- knowledge graph status and paths match reality.

## Required final report for every phase

Provide:

1. Outcome first.
2. Files changed.
3. Behavior changed and behavior deliberately unchanged.
4. Strict-constraint implications.
5. Database/query/complexity implications.
6. Realtime and latency implications.
7. Tests and exact results.
8. Benchmark before/after results.
9. Migrations and rollback notes, when applicable.
10. V1 assumptions and unresolved decisions.
11. `Grounded in:` with exact graph nodes and doc sections.

Do not call a phase complete if required tests were not run or if the knowledge graph was not updated.

---

Grounded in: C2/S1-S8, C3/E1-E9, C4/M1-M18, C5/Fo1-Fo10, C6/L1-L5,
C7/D1-D19, C8/A1-A17, C9/B1-B12/B-rt, C10/V1-V5, C11/Q1-Q18; governing docs
`04`, `05`, `09`, `10`, `11`, `12`, `13`, `14`, `15`, and `17`.

