# Phase 5 — Pairing Engine Internals (LOCKED math only)

Deterministic building blocks: hard rules, fallback, objectives, leftovers, chair assignment,
metrics loader, candidate generation, top-band selection. **No OPEN formulas here.**

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol (Rule 3 status discipline; Rule 5 bounded search + auditable
   randomness; Rule 7 anti-hallucination).
2. Read docs/pairing-knowledge-graph.md; locate community C3 (E3–E9), C5 formulas, and nodes
   B2,B4,B5,B6,B7,B8,B9,B-ml.
3. Read ONLY:
   - docs/16-build-plan.md → Phase 5
   - docs/04-pairing-engine-flow.md (the pipeline)
   - docs/05-pairing-metrics.md (hard rules, fallback, chair logic, leftover, top-band)
   - docs/09-metric-formulas.md — IMPLEMENT ONLY status FINALIZED ENOUGH / LOCKED formulas:
     Fo1 effective_weight, Fo2 confidence, Fo3 fallback blend, Fo6 chair_assignment_score,
     Fo7 room_count/leftovers, Fo8 top-band selection, Fo9 objective multiplier.
   - docs/11-backend-implementation-map.md → Pairing Module File Map (these exact files)
   - docs/15-pairing-engineering-quality-standard.md → §3 engine stages, §4 search discipline,
     §11 auditable randomness
   - types/* and repositories from earlier phases
4. Confirm gates 2,6,7 resolved and Phase 4 done. If not, STOP.

DO NOT implement any STILL OPEN / Fo10 formula (team_quality_aggregate, full proposal_score,
consistency_score, experience_index, pair-dynamics aggregation, role_score aggregation,
tuning-adjustment). The soft-scoring math and the engine orchestrator are Phase 6.

TASK — Phase 5. Create only these files under lib/server/pairing/:
- hard-rules.ts      → validateHardRules(candidate, ctx), isCandidateValid(candidate, ctx)
- fallback.ts        → computeConfidence(obs, target), blendSpecificWithFallback(spec, fb, conf),
                        resolveMetricWithFallback(input)   [Fo2, Fo3]
- objectives.ts      → getObjectiveMultipliers(objective), applyObjectiveMultiplier(weight, mult) [Fo9]
- leftovers.ts       → computeRoomPlan(speakerCount), buildUnassignedParticipants(participants) [Fo7]
- chair-assignment.ts→ computeChairAssignmentScore(input) [Fo6], assignChairsToRooms(ctx)
- metrics-loader.ts  → loadPairingMetrics(sessionId), loadSessionInputs(sessionId)
- candidate-generator.ts → generateCandidateProposals(ctx)  [bounded; explicit max-candidate cap]
- proposal-selector.ts   → selectProposalFromTopBand(candidates, options) [Fo8; weighted random]
- types.ts (engine-internal types)

Requirements (docs/15):
- Hard-rule filtering happens EARLY; randomness affects validity NEVER.
- Candidate generation is BOUNDED with an explicit max-candidate count and time budget from V1.
- Engine reads only from the pre-shaped PairingGenerationContext (Maps); NO DB queries in loops.
- Selection is deterministic given a seed; capture seed + rank + probability for audit (§11).
- Pure helper functions for math where no mutation is needed; numeric safety (clamp, no /0,
  explicit zero-observation fallback).

Hard rules:
- Function names/weights/fallback chains come from docs/05/09/11 only. If missing, STOP.
- proposal-scorer.ts and engine.ts are NOT built in this phase.

VERIFY: typecheck + unit tests for: confidence fallback (Fo2/Fo3), leftover handling (Fo7),
chair assignment (Fo6), top-band normalization + zero-observation fallback (Fo8). Show results.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark B2,B4,B5,B6,B7,B8,B9,B-ml BUILT with paths; record
  the enforced max-candidate/time-budget guardrail values chosen.
- Print "Grounded in:".
```

---

## Done-when
- All nine internal files exist; only LOCKED formulas implemented; bounded search with enforced caps.
- Randomness isolated + auditable; unit tests pass (shown).
- Listed graph nodes marked BUILT; `Grounded in:` printed.

## Note
This phase deliberately stops before soft scoring. If the engine appears to "need" a scoring
function, that is Phase 6 and is blocked by Gate 10.
</content>
