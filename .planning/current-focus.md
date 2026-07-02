# Current Focus

## Active Area
- Pairing system frontend/backend integration with build stabilization

## Current Working Mode
- Use `.planning` as navigation and working memory
- Use repo docs and code as the source of truth

## Last Verified
- Pairing dashboard sidebar structure exists
- Separate speaker and adjudicator leaderboard views exist
- Home dashboard exists
- Session workspace now closes scored sessions back to new-session entry state (Verified)
- Session metadata mapper now includes `sessionRules` in the service layer
- Repo still has pre-existing type-check failures outside this task (Verified)
- Local build now reaches a Windows spawn EPERM after type-check starts

## Open Risks
- `.planning/codebase/*` can drift from the repo if not refreshed
- Generated `.next/dev/types/*` may fail type-check independently of feature work
- Local Windows/Turbopack spawn errors may be environment-specific

## Next Useful Checks
- Re-verify `.planning` summaries against real file paths before relying on them
- Keep route/file references marked as verified vs derived
- Add task-specific focus sections when switching features

## Update Rule
- Only update this file when the active task, blocker, or verified state materially changes