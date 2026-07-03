# Current Focus

## Active Area
- Pairing system frontend/backend integration with member scoring-task self-view repair

## Current Working Mode
- Use `.planning` as navigation and working memory
- Use repo docs and code as the source of truth

## Last Verified
- Session workspace can now cancel an unpublished in-progress session and return to the new-session entry state after clearing session-scoped draft data (Verified in code; runtime/browser re-check still needed)
- Pairing progress profiles now trigger metric snapshot refresh after accepted speaker/chair submissions, so progress reads no longer rely on stale empty snapshot state alone (Verified in code; runtime/browser re-check still needed)
- Member scoring-task reads were failing because `GET /api/sessions/:sessionId/scoring-status` treated "no scoring obligation in this session" as a 403 for `Member` viewers; locally repaired in `session-service.ts` so the self-view now returns an empty task list instead (Verified in code, runtime still needs browser re-check)
- Pairing dashboard sidebar structure exists
- Separate speaker and adjudicator leaderboard views exist
- Home dashboard exists
- Session workspace now closes scored sessions back to new-session entry state (Verified)
- Session metadata mapper now includes `sessionRules` in the service layer
- Session Workspace draft state was being rehydrated by dashboard auto-refresh plus participant-prop reload coupling (Verified)
- Pairing dashboard auto-refresh is now limited to Home and leaderboard tabs; interaction-heavy tabs stay stable while in use (Verified)
- Published pairing chair assignments can drift from `SessionRoleAssignment` unless publish sync rewrites roles from official room assignments (Verified and repaired locally)
- Repo still has pre-existing type-check failures outside this task (Verified)
- Local build now reaches a Windows spawn EPERM after type-check starts

## Open Risks
- `.planning/codebase/*` can drift from the repo if not refreshed
- Generated `.next/dev/types/*` may fail type-check independently of feature work
- Local Windows/Turbopack spawn errors may be environment-specific
- `npm run test:services` is currently blocked by an existing ESM module-resolution issue in the cache layer (`lib/server/cache/redis` import path), so the local regression test could not be executed end-to-end here
- Existing published sessions may need one-time data repair if they were published before the role-sync fix

## Next Useful Checks
- Re-verify `.planning` summaries against real file paths before relying on them
- Keep route/file references marked as verified vs derived
- Add task-specific focus sections when switching features

## Update Rule
- Only update this file when the active task, blocker, or verified state materially changes

