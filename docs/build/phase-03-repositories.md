# Phase 3 — Repositories (`B-repo`)

All Prisma access lives here. Front-loaded, projected, transactional. Nothing else queries the DB.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol (Rule 5: Prisma ONLY in repositories; Rule 7 anti-hallucination).
2. Read docs/pairing-knowledge-graph.md; locate node B-repo (C9).
3. Read ONLY:
   - docs/16-build-plan.md → Phase 3
   - docs/11-backend-implementation-map.md → "Repository File Map"
   - docs/15-pairing-engineering-quality-standard.md → §6 (DB access), §7 (pre-shaped context),
     §13 (transactions)
   - prisma/schema.prisma (the models from Phase 2) and types/* (Phase 1)
4. Confirm Phase 2 is done (schema migrated, graph updated). If not, STOP.

TASK — Phase 3. Create only these files:
- lib/server/repositories/pairing-repository.ts
- lib/server/repositories/session-repository.ts
- lib/server/repositories/scoring-repository.ts
- lib/server/repositories/metrics-repository.ts
- lib/server/repositories/eval-repository.ts

Requirements:
- Implement the batch loaders named in docs/11/15: getGenerationContext(sessionId),
  getMemberMetricSnapshots(memberIds), getPairMetricSnapshots(pairKeys),
  getRoomAssignmentSummary(sessionId), publishProposalTransaction(input).
- Every read projects ONLY needed fields (no select-all). No N+1.
- Publish and any multi-step write use a Prisma transaction.
- Return the typed shapes from types/* (Phase 1); repositories contain NO business/scoring logic
  and NO request/response formatting.
- Import the shared Prisma client from lib/server/prisma.ts (do not instantiate a new client).

Hard rules:
- This is the ONLY layer allowed to call Prisma. Do not put queries anywhere else.
- Function/return names come from docs/11. If something is missing, STOP and ask.

VERIFY: typecheck passes (show it). Add/run repository-level tests for the critical query shapes
(getGenerationContext projection, publishProposalTransaction atomicity) and show results.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark B-repo BUILT with file paths and the loader method
  names actually used.
- Print "Grounded in:".
```

---

## Done-when
- All five repository files exist; every Prisma call lives here; no N+1; transactions wrap publish.
- Typecheck + repository tests pass (shown).
- Graph node B-repo marked BUILT; `Grounded in:` printed.
</content>
