# Phase 0 — Decision Freeze (NO CODE)

Resolve the 10 pre-coding gates before any implementation. This phase writes decisions into docs,
not code.

---

## Prompt (paste verbatim)

```
You are working on the DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md in full, especially the "Pairing System — Binding Agent Protocol" block.
2. Read docs/pairing-knowledge-graph.md in full.
3. Read docs/07-open-questions.md and docs/08-pre-coding-decisions.md.
4. Read docs/09-metric-formulas.md status legend (Finalized / Proposed V1 / Still Open).

TASK — Phase 0 of docs/16-build-plan.md (Decision Freeze). Do NOT write any code, schema,
or types in this phase.

For each of the 10 "Pre-coding gates" listed at the bottom of docs/pairing-knowledge-graph.md:
- State the gate.
- Summarize what docs/07 and docs/08 already decide about it vs. what is still OPEN.
- For anything still OPEN, ask me a precise question with the available options and your
  recommendation. Ask the OPEN gates one at a time; wait for my answer.

Pay special attention to:
- Gate 1 (metric catalog M1–M13, M18, M11),
- Gate 2 (hard vs soft rule split),
- Gate 3 (session-role-only routing),
- Gate 4 (post-session form fields),
- Gate 10 (the OPEN Fo10 formulas: team_quality_aggregate, full proposal_score,
  consistency_score, experience_index, pair-dynamics aggregation, role_score aggregation,
  tuning-adjustment) — these block Phase 6 and MUST NOT be invented.

After I answer each gate:
- Record the decision in docs/07-open-questions.md (remove the item once locked) and/or
  docs/08-pre-coding-decisions.md.
- Reflect the change in docs/pairing-knowledge-graph.md: flip the gate/status and adjust any
  affected node's LOCKED/PROPOSED-V1/OPEN marker.

Do not implement anything. Do not guess. If a decision is mine to make, ask.

End with a "Grounded in:" line citing the docs and graph sections you used.
```

---

## Done-when
- Every gate is either marked resolved (with the decision written into `docs/07`/`docs/08`) or
  explicitly flagged as still needing the user, with the question asked.
- `docs/pairing-knowledge-graph.md` gate/status markers updated to match.
- No code, schema, or type files were created.

## Note
Gate 10 (Fo10) may remain OPEN after this phase — it only blocks Phase 6. All other phases can
proceed once their own gates are green.
</content>
