# Phase 9 — Eval Harness + Tuning (`B-eval`, `B-tune`, `V1–V5`, `L4`)

The safety net around learning: replay + regression vs. baseline, and bounded periodic tuning.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol (Rule 3 OPEN tuning formula; Rule 4 gate; Rule 5 layering).
2. Read docs/pairing-knowledge-graph.md; locate community C10 (V1–V5), B-eval, B-tune, L4, L5.
3. Read ONLY:
   - docs/16-build-plan.md → Phase 9
   - docs/10-eval-harness.md (replay, dimensions, regression, run strategy, thresholds)
   - docs/13-pairing-learning-loop.md → tuning sections
   - docs/11-backend-implementation-map.md → Eval Module File Map + tuning.ts
   - docs/12-backend-data-model-map.md → deferred eval/tuning models
   - docs/15-pairing-engineering-quality-standard.md → §19 (eval as safety net)
   - earlier-phase engine, repositories, types
4. Confirm gate 8 (tuning governance: review-assisted vs partial auto) resolved and Phase 8 done.
   If not, STOP.

GATE 10 NOTE: the tuning-adjustment formula is part of Fo10. Implement it ONLY if I confirmed its
exact math; otherwise implement tuning as SUGGESTION-ONLY (no auto weight changes) and ask me.

TASK — Phase 9. Create only:
- lib/server/eval/harness.ts → runPairingEval(input)
- lib/server/eval/replay-runner.ts → runHistoricalReplay(input), runSyntheticReplay(input)
- lib/server/eval/regression-checker.ts → compareEvalReports(candidate, baseline)
- lib/server/eval/report-builder.ts → buildEvalReport(input)
- lib/server/eval/synthetic-scenarios.ts → getSyntheticPairingScenarios()
- lib/server/eval/types.ts
- lib/server/pairing/tuning.ts → buildTuningReview(window), suggestMetricAdjustments(window)
Also add the deferred Prisma models now (EvalScenario, EvalRun, EvalScenarioResult,
TuningReviewWindow, MetricAdjustmentHistory, LeaderboardSnapshot) via a new migration, with the
field names from docs/12.

Requirements (docs/13/15):
- Replay runs N times per scenario (count per gate / docs/07 §8); scores the dimensions in docs/10.
- Regression check compares against a stored baseline; any change to scores/candidate-gen/tuning/
  fallback must pass before being trusted (§19).
- Tuning is bounded: |learned_adjustment delta| <= 0.03; never breaks hard rules; auditable;
  obeys the HE3 safe-learning rules in the graph.
- Keep eval and tuning in their OWN layer, separate from runtime generation (L5).

Hard rules:
- New model/field names from docs/12 only. Tuning math: confirmed Fo10 or suggestion-only. If
  unsure, STOP.

VERIFY: migration applies (shown); typecheck + tests for replay determinism, regression compare,
and bounded tuning suggestion. Show results.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark B-eval, B-tune, V1–V5, L4 BUILT; add the new
  deferred models as BUILT nodes; flip gate 8 status.
- Print "Grounded in:".
```

---

## Done-when
- Eval files + `tuning.ts` exist; deferred models migrated; replay + regression work vs. baseline.
- Tuning bounded (`|Δ|≤0.03`) and auditable (or suggestion-only); tests pass (shown).
- Graph nodes BUILT + new model nodes added; `Grounded in:` printed.
</content>
