# Phase 10 — Realtime Websocket Integration (`B-rt`, `A17`)

Build the dedicated realtime architecture for pairing-system websocket delivery. This phase owns the websocket transport and post-commit event fan-out.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol. This phase may touch `app/api/**/route.ts` only for the dedicated
   websocket entrypoint; no UI, no page.tsx, no components, no styling.
2. Read docs/pairing-knowledge-graph.md; locate A17 in C8, B-rt in C9, and the realtime quality
   rules in C11.
3. Read ONLY:
   - docs/16-build-plan.md -> Phase 10
   - docs/17-websocket-realtime-flow.md (AUTHORITATIVE realtime flow)
   - docs/11-backend-implementation-map.md -> realtime module map, shared type file map, route mapping
   - docs/14-api-routing-map.md -> realtime route contract
   - docs/15-pairing-engineering-quality-standard.md -> §2, §16, §24
   - node_modules/next/dist/docs/ for the route-handler API of THIS Next version (do not assume)
   - earlier-phase services that will emit post-commit events
4. Confirm Phase 9 is done. If not, STOP.

TASK — Phase 10. Create only:
- `types/realtime.ts`
- `lib/server/realtime/websocket-hub.ts`
- `lib/server/realtime/event-publisher.ts`
- `lib/server/realtime/channel-auth.ts`
- `lib/server/realtime/types.ts`
- `app/api/realtime/socket/route.ts`

You may patch earlier-phase service entry points only where needed to publish realtime events AFTER
successful commit, exactly as docs/17 requires.

UX requirements:
- admin lifecycle screens should not require manual refresh during active workflow
- member publication visibility should feel immediate after official publish
- scoring and leaderboard screens should refresh from post-commit notifications, not tight polling
- reconnect should recover through authenticated resubscribe plus HTTP refetch

Requirements:
- Websocket delivery is supplemental to HTTP, never the source of truth.
- Events are emitted only after authoritative commit.
- Payloads are role-filtered and session-filtered.
- Members must never receive unpublished proposal events.
- Reconnect must be recoverable through authenticated resubscribe plus HTTP refetch.
- Routes do NOT emit websocket events directly; services call the realtime publisher.

Hard rules:
- Realtime route path, visibility rules, and event scope come from docs/17 and docs/14 only.
- Use the real route-handler API from node_modules/next/dist/docs; do not guess.

VERIFY: typecheck plus realtime integration tests:
- allowed roles can connect
- unauthorized connection or subscription is rejected
- admin subscribers receive post-commit proposal lifecycle events
- members do not receive unpublished proposal events
- websocket fan-out failure does not corrupt committed state
Show results.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark A17 and B-rt BUILT with the actual file paths.
- Print "Grounded in:".
```

---

## Done-when
- Realtime shared types, modules, and websocket entrypoint exist.
- Realtime delivery is post-commit, role-safe, and recoverable through HTTP refetch.
- Realtime UX is notify-first and avoids manual refresh loops for active pairing workflows.
- Realtime tests pass (shown).
- Graph A17 plus B-rt BUILT; `Grounded in:` printed.
