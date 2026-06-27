# Phase 4 — Session, Attendance & Role Services (`B-sess`)

The entry point to generation: prepared attendance pool + session-role assignment + lifecycle state.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol (Rule 5 layering; Rule 6 session-role vs account-role).
2. Read docs/pairing-knowledge-graph.md; locate node B-sess (C9), state S1 (C2), rule R4 (C1).
3. Read ONLY:
   - docs/16-build-plan.md → Phase 4
   - docs/11-backend-implementation-map.md → "Session Module File Map"
   - docs/02-backend-changes.md → §1 (attendance), §2 (session)
   - docs/14-api-routing-map.md → §1 (attendance), §2 (sessions)
   - docs/15-pairing-engineering-quality-standard.md → §9 (state machine)
   - types/* (Phase 1), the repositories from Phase 3
4. Confirm gate 3 (session-role-only routing) resolved and Phase 3 done. If not, STOP.

TASK — Phase 4. Create only:
- lib/server/sessions/session-service.ts
  exports: getSessionPreparationContext(sessionId), updateSessionLifecycleState(input)
- lib/server/sessions/attendance-service.ts
  exports: prepareAttendance(input), markAttendance(input),
           finalizeAttendanceFromPublishedPairing(sessionId)
- lib/server/sessions/session-role-service.ts
  exports: assignSessionRole(input), getUserSessionRole(sessionId, userId)

Requirements:
- Services orchestrate; all DB access goes through Phase 3 repositories. No Prisma here.
- Lifecycle state changes go through explicit, validated transitions (docs/15 §9) — e.g. you
  cannot move to a generation-ready state without a valid prepared pool.
- Session role is read/written via SessionRoleAssignment, never confused with account role.
- Use the exact export names from docs/11.

Hard rules:
- No routes, no UI, no Prisma outside repositories. If a name/field is missing from docs, STOP.

VERIFY: typecheck + service tests for prepare→mark→assign-role flow and a guarded illegal
transition. Show results.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md: mark B-sess BUILT with paths; mark S1 reachable.
- Print "Grounded in:".
```

---

## Done-when
- Three service files exist; lifecycle transitions guarded; session-role distinct from account role.
- Typecheck + service tests pass (shown).
- Graph node B-sess marked BUILT; `Grounded in:` printed.
</content>
