# Architecture

**Analysis Date:** 2026-07-02

## Verification Status

- Overall status: `Mostly verified`
- Trust level: good for orientation and implementation boundaries, but exact route entrypoints should still be re-checked in code
- Use rule:
  - use this file to understand layer boundaries
  - verify exact handlers and service exports before changing code

## Core Shape

- Frontend UI lives in `app/` and `components/`
- Server logic lives in `lib/server/`
- Database access is concentrated under `lib/server/repositories/`
- Shared contracts live in `types/`
- Pairing specs and protocol remain in `docs/` and `AGENTS.md`

## Verified Backend Layers

- Route/transport boundary exists through `app/api/**/route.ts`
- Guard helpers exist in `lib/server/guards.ts`
- Validation area exists in `lib/server/validations/`
- Pairing domain exists in `lib/server/pairing/`
- Session domain exists in `lib/server/sessions/`
- Scoring domain exists in `lib/server/scoring/`
- Realtime domain exists in `lib/server/realtime/`
- Repository layer exists in `lib/server/repositories/`

## Verified Architectural Signals

- `requireSessionUser` is present and used as a role guard helper
- `getGenerationContext` exists and is used by pairing internals
- pairing and scoring services publish realtime events through `realtime/event-publisher.ts`
- tests exist for repositories, pairing internals, sessions, scoring, and realtime areas

## Safe Working Model

- API route: parse, guard, validate, delegate
- Service/domain: business rules and orchestration
- Repository: Prisma reads and writes
- Types: shared contracts and payload shapes

## Re-check Before Relying On

- exact route file locations for each domain action
- whether every route fully follows the thin-handler rule today
- whether seeded randomness and audit metadata are fully complete in every pairing path
- whether all realtime flows are already wired to UI consumers

## Working Rule For Agents

When touching pairing or backend logic:
- read the authoritative docs first
- use this file only to find the correct layer
- inspect the actual file before assuming a route, service, or repository already exists

---

*Trimmed to verified architectural boundaries and implementation signals.*
