# Phase 6 — Scoring Engine + Orchestrator (`B3`, `B1`) — BLOCKED BY GATE 10

The soft-scoring math and the top-level `generatePairingProposal` orchestrator. **Do not start
until the user has confirmed the exact `Fo10` formulas.**

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol (Rule 3: OPEN formulas forbidden until specified; Rule 4 gates;
   Rule 5 auditable persistence).
2. Read docs/pairing-knowledge-graph.md; locate E8 (scoring), B3 proposal-scorer, B1 engine, C5.
3. Read ONLY:
   - docs/16-build-plan.md → Phase 6
   - docs/09-metric-formulas.md → §10–§17 (the Fo10 formulas) — and the confirmed specs I gave you
   - docs/05-pairing-metrics.md (weighting layers)
   - docs/04-pairing-engine-flow.md → §9–§12
   - docs/11-backend-implementation-map.md → engine.ts and proposal-scorer.ts
   - docs/15-pairing-engineering-quality-standard.md → §3, §11
   - the Phase 5 engine internals, repositories, types

GATE 10 CHECK (HARD STOP): the Fo10 formulas — team_quality_aggregate, full proposal_score,
consistency_score, experience_index, pair-dynamics aggregation, role_score aggregation — must be
CONFIRMED by me with exact math. If any is still OPEN, STOP and ask me for it. Do NOT invent it.

TASK — Phase 6. Create only:
- lib/server/pairing/proposal-scorer.ts → scoreProposal(candidate, ctx), scoreTeam(team, ctx)
  implementing the CONFIRMED Fo10 math + the LOCKED weighting/objective layers.
- lib/server/pairing/engine.ts → generatePairingProposal(input): runs the 9 stages
  (load context once → load metrics once → feasibility → generate candidates → reject invalid →
   score → keep top band → probabilistic select → persist proposal), composing the Phase 5
   internals and Phase 3 repositories.

Requirements (docs/15):
- Score is deterministic for a fixed candidate + fixed context.
- Persist the proposal with engine version, rule version, metric-snapshot version, candidate score
  summary, top-band rank, selection probability, random seed, and objective (§11).
- No DB queries inside candidate/scoring loops; everything from the pre-shaped context.
- If no valid proposal exists, fail explicitly with a machine-readable reason (§3, §15).

Hard rules:
- Every weight/formula is from docs/09 (confirmed) or docs/05. Nothing invented. If unsure, STOP.

VERIFY: typecheck + tests: deterministic score for fixed input; persistence includes all audit
fields; no-valid-proposal returns a clean typed failure. Then run the Phase 9 eval harness against
a baseline if it exists; show results. Do not declare the engine trusted without eval evidence.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark B1, B3 BUILT; flip Fo10 statuses to LOCKED with the
  confirmed formula recorded; note the audit fields persisted.
- Print "Grounded in:".
```

---

## Done-when
- Gate 10 confirmed; `proposal-scorer.ts` + `engine.ts` exist; scoring deterministic.
- Proposal persisted with full audit metadata; no-valid-proposal path is clean.
- Eval (Phase 9) green vs. baseline before trusting; graph B1/B3 BUILT, Fo10 LOCKED; `Grounded in:` printed.
</content>
