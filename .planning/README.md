# Planning Workspace

This folder is a lightweight working-memory layer for the repo.

Use it for:
- short operational context
- verified repo structure snapshots
- known concerns and active blockers
- current focus and next actions

Do not use it as the source of truth for:
- pairing rules
- API contracts
- database contracts
- access-control rules
- product decisions

Those remain authoritative in:
- `AGENTS.md`
- `docs/**`
- actual code and schema files

## Suggested usage

1. Read authoritative docs first.
2. Read `.planning/current-focus.md`.
3. Use `.planning/codebase/*.md` for quick orientation only.
4. Open the real files that matter.
5. After finishing work, update only the planning files that materially changed.

## File roles

- `current-focus.md` - active task, status, next steps
- `codebase/STRUCTURE.md` - where things live
- `codebase/ARCHITECTURE.md` - major boundaries and layers
- `codebase/CONVENTIONS.md` - coding and naming rules
- `codebase/STACK.md` - runtime and dependency facts
- `codebase/INTEGRATIONS.md` - external services and auth
- `codebase/TESTING.md` - real test entrypoints and caveats
- `codebase/CONCERNS.md` - debt, bugs, risks, drift

## Verification labels

Prefer marking notes with one of:
- `Verified`
- `Derived`
- `Expected`
- `Needs re-check`
