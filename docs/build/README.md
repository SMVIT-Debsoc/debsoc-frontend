# docs/build — Per-Phase Build Prompts

This folder turns `docs/16-build-plan.md` into **ready-to-run prompts**, one per phase. Each file
contains a single copy-paste prompt for Codex or Claude that is self-contained, routed through the
binding protocol, and ends by updating the memory graph.

## How to use
1. **Backend only, right now.** Every prompt enforces the backend-only scope lock from `AGENTS.md`.
   No UI, no components, no styling.
2. **One phase per conversation.** Start a fresh session, paste the phase file's prompt verbatim.
3. **Do Phase 0 first.** Nothing downstream may start until its pre-coding gate is resolved.
4. **Respect ordering.** A phase may not begin until the previous phase's "Done-when" passed and
   the knowledge graph was updated for it.
5. **Verify the close-out.** Every prompt ends with: update `docs/pairing-knowledge-graph.md` and
   print a `Grounded in:` citation. If a tool skips either, reject the output and re-run.

## Phase index
| File | Phase | Builds | Blocking gate |
|------|-------|--------|---------------|
| `phase-00-decision-freeze.md` | 0 | Resolve the 10 pre-coding gates (no code) | — |
| `phase-01-shared-types.md` | 1 | `types/*` contracts, enums, ids, context type | 1, 5 |
| `phase-02-schema.md` | 2 | Prisma models D1–D18 + migration | 1,2,3,4,5 |
| `phase-03-repositories.md` | 3 | `lib/server/repositories/*` | — |
| `phase-04-session-services.md` | 4 | session / attendance / session-role services | 3 |
| `phase-05-engine-internals.md` | 5 | engine internals (LOCKED math only) | 2,6,7 |
| `phase-06-scoring-engine.md` | 6 | proposal-scorer + engine orchestrator | **10 (Fo10)** |
| `phase-07-review-publish.md` | 7 | review, publish, published read | 9 |
| `phase-08-post-session-scoring.md` | 8 | scoring services + metric update | 4 |
| `phase-09-eval-tuning.md` | 9 | eval harness + tuning | 8 |
| `phase-10-routes.md` | 10 | validations + API route wiring | per-route |
| `phase-11-cleanup.md` | 11 | deprecation cleanup | 9 |

## The invariant every prompt carries
> Read `AGENTS.md` (pairing protocol) → read `docs/pairing-knowledge-graph.md` → read ONLY the
> cited docs + the relevant `docs/15` sections → confirm the gate → build the listed deliverables →
> pass the `docs/15 §22` checklist and the phase Done-when → update the knowledge graph → print
> `Grounded in:`.
</content>
