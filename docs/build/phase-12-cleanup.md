# Phase 11 — Deprecation Cleanup

Remove/replace the legacy flows the pairing system supersedes — only after the replacement is live
and confirmed.

---

## Prompt (paste verbatim)

```
DebSoc debate pairing system, BACKEND ONLY.

FIRST, follow the binding protocol:
1. Read AGENTS.md pairing protocol (Rule 6 preserve history; Rule 7 verify before deleting).
2. Read docs/pairing-knowledge-graph.md (the BUILT state of the system so far).
3. Read ONLY:
   - docs/16-build-plan.md → Phase 11
   - docs/02-backend-changes.md → §12 (removals)
   - docs/11-backend-implementation-map.md → "Existing Areas Likely To Be Replaced Or Reduced"
   - docs/07-open-questions.md → §9 (cleanup scope)
   - docs/15-pairing-engineering-quality-standard.md → §14 (historical readability)
4. Confirm gate 9 (cleanup scope confirmed) and that the replacement flows are live + tested.
   If not, STOP.

TASK — Phase 11. Candidate removals (CONFIRM EACH WITH ME before deleting anything):
- anonymous feedback flow
- task assignment flow
- attendance-linked manual pairing behavior
- attendance-linked speaker-score behavior
- old non-proposal session routes

For each candidate:
- Show me exactly what file/route/model/field would be removed or reduced and what now replaces it.
- Verify (grep/read) that nothing still depends on it. Do not delete blindly.
- Ensure old published/historical data and migrations remain readable (docs/15 §14).
- Only remove after I confirm, and only behind the working replacement.

Hard rules:
- Never delete something you did not verify is dead. Never break historical readability.
- If a "dead" path still has a live caller, STOP and report it.

VERIFY: typecheck + full test suite green after each removal; show results.

CLOSE-OUT (required):
- Update docs/pairing-knowledge-graph.md and docs/02 §12: mark each removed flow as RETIRED with
  what replaced it.
- Print "Grounded in:".
```

---

## Done-when
- Each removal confirmed, replaced, verified dead, and history-safe; test suite green (shown).
- Graph + `docs/02 §12` updated to RETIRED; `Grounded in:` printed.
</content>

