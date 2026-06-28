# Phase 11 � Validations + API Route Wiring (`B-val`, `A1�A14`)

The ONLY phase that touches `app/` for HTTP route wiring. Thin route handlers + zod validations, wired to the services.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol. NOTE: this is the ONLY phase where you may touch app/ � and
   ONLY app/api/**/route.ts files. No UI, no page.tsx, no components, no styling.
2. Read docs/pairing-knowledge-graph.md; locate community C8 (A1�A14) and node B-val.
3. Read ONLY:
   - docs/16-build-plan.md -> Phase 11
   - docs/14-api-routing-map.md (AUTHORITATIVE route contracts, methods, access, payloads)
   - docs/11-backend-implementation-map.md -> "API Route To Service Mapping"
   - docs/15-pairing-engineering-quality-standard.md ? �2 (thin routes), �16 (security)
   - node_modules/next/dist/docs/ for the route-handler API of THIS Next version (do not assume)
   - the services from earlier phases, lib/server/guards.ts, lib/server/http.ts, lib/server/roles.ts
4. Confirm each route's backing service exists (its phase passed). If a service is missing, STOP.

TASK � Phase 11. Build in docs/14 V1 priority order:
- lib/server/validations/{pairing,scoring,session}-validation.ts (zod v4 schemas)
- Then route handlers (app/api/**/route.ts):
  1. attendance/{prepare,mark}                (A1,A2)  roles ["cabinet","President"]
  2. sessions/[sessionId] (+ scoring-status)  (A3,A3b,A3c)
  3. pairing/generate                         (A4)   roles ["cabinet","President"]
  4. pairing/proposal/[proposalId]/{,approve,override,regenerate,rate} (A5�A9)
  5. pairing/publish/[sessionId]              (A10)  roles ["cabinet","President"]
  6. pairing/published/[sessionId]            (A11)  roles ["Member","cabinet","President"]
  7. scoring/{speaker,chair}                  (A12,A13) authenticated + SESSION-role check in service
  8. leaderboard/{speakers,adjudicators}      (A13b)
  9. eval/{replay,compare}                    (A14)  roles ["TechHead","President"]

Each route handler MUST do ONLY: authenticate+authorize via requireSessionUser({roles}) ->
validate body/params with the zod schema -> call exactly ONE service -> shape the response with the
http.ts helpers. NO formulas, NO orchestration, NO Prisma in routes (docs/15 �2).
Member-visible responses must not leak admin-only review/scoring detail (docs/15 �16).

Hard rules:
- Route paths, methods, access, payloads come from docs/14 only. If a path/field is missing, STOP.
- Use the real route-handler signature from node_modules/next/dist/docs/ � do not guess the API.

VERIFY: typecheck + integration tests from docs/15 �18: cabinet/president can generate+publish,
member cannot, member reads published, speaker hits correct scoring route by session role,
double-publish blocked, duplicate score safe. Show results.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark A1�A14 and B-val BUILT with the actual route paths.
- Print "Grounded in:".
```

---

## Done-when
- Validations + all V1 routes exist; each route is transport-only; access matches docs/14.
- Integration tests from `15 �18` pass (shown); no UI files created.
- Graph A1�A14 + B-val BUILT; `Grounded in:` printed.
</content>
