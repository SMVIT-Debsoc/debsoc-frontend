# Phase 1 — Shared Types (`B0`)

Build the shared TypeScript contracts the whole backend speaks. No logic, no Prisma, no routes.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md "Pairing System — Binding Agent Protocol" in full (note the SCOPE LOCK:
   backend only; and Rule 7 anti-hallucination).
2. Read docs/pairing-knowledge-graph.md in full; locate node B0 (community C9) and community C6
   (TypeScript rigor lives in docs/15 §8).
3. Read ONLY these docs for this phase:
   - docs/16-build-plan.md → Phase 1
   - docs/11-backend-implementation-map.md → "Shared Type File Map"
   - docs/15-pairing-engineering-quality-standard.md → §7 (context object) and §8 (TS rules)
   - docs/05-pairing-metrics.md and docs/12-backend-data-model-map.md for exact enum/field names
4. Confirm gates 1 and 5 are resolved (per docs/07/08). If not, STOP and tell me.

GATE CHECK: do not proceed unless the metric catalog (gate 1) and core models (gate 5) are
accepted.

TASK — Phase 1. Create these files only:
- types/pairing.ts, types/session.ts, types/scoring.ts, types/eval.ts

They must define (names/values copied exactly from the docs, never invented):
- Enums or `as const` unions: ProposalStatus, SessionRole, PairingObjective
  (DEVELOPMENT | BALANCED | COMPETITIVE), MotionType, ReviewAction, ScoreSubmissionType,
  LeftoverReason, TuningMode, BenchPosition (OG|OO|CG|CO),
  SpeakingRole (PM|DPM|LO|DLO|MG|GW|MO|OW).
- Aliased ids: MemberId, SessionId, ProposalId, PairKey, MetricKey.
- The PairingGenerationContext interface exactly as shown in docs/15 §7 (Maps for member/pair
  lookups), plus the supporting payload interfaces it references.
- Route-level request/response DTOs implied by docs/14 for the endpoints (proposal summary,
  review payloads, published pairing view, speaker/chair scoring payloads, eval payloads).

Hard rules:
- No `any`. No untyped JSON blobs in core types. Nullability explicit.
- Do NOT touch app/, components/, prisma/, or lib/server/ in this phase.
- If a needed type name/field is not in a doc, STOP and ask — do not invent it.

VERIFY: run the TypeScript compiler (tsc --noEmit or the project's typecheck script) and show me
the result. Do not claim success without running it.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark node B0 as BUILT with the file paths; correct any
  type detail the docs got wrong; note PROPOSED-V1 assumptions.
- Print a "Grounded in:" line citing graph nodes + doc sections used.
```

---

## Done-when
- `types/{pairing,session,scoring,eval}.ts` exist; typecheck passes (shown, not claimed).
- No `any`; every enum value matches docs exactly; ids aliased.
- Graph node B0 marked BUILT with paths; `Grounded in:` printed.
</content>
