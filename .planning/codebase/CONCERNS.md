# Codebase Concerns

**Analysis Date:** 2026-07-02

## Tech Debt

**Participant Reference Pattern:**
- Issue: Every debater-referencing entity in `prisma/schema.prisma` uses a participant reference (`memberId?`, `cabinetId?`, `presidentId?`) instead of a single unified user table, because `Member`, `cabinet`, and `President` accounts exist in separate tables.
- Files: `prisma/schema.prisma` (e.g. `Attendance`, `SessionRoleAssignment`, `TeamSpeakerAssignment`, `RoomAdjudicatorAssignment`, `UnassignedParticipant`).
- Why: Retained historical separation of cabinet, president, and standard member records.
- Impact: Substantially increases the complexity of database queries, updates, and validations, requiring three-way key checking (`memberId`, `cabinetId`, `presidentId`) whenever resolving a participant's identity or metrics.
- Fix approach: Create a unified user profile representation or a common mapping view/interface to reduce query branching.

**Manual Mock Verification in Tests:**
- Issue: Mocking is done by writing inline Prisma stubs and recording execution routes in arrays (`calls.push(...)`).
- Files: `lib/server/repositories/repositories.test.ts`, `lib/server/sessions/services.test.ts`.
- Why: Kept test runner dependency-free without importing external mocking libraries (like Sinon or Jest).
- Impact: Test setups are verbose and fragile; refactoring repository methods requires manually updating matching stub interfaces in multiple test blocks.
- Fix approach: Introduce a standard mock utility helper or light mocking helper library.

## Known Bugs

**Sandbox Node Test Spawning:**
- Symptoms: Running test scripts with `node --test` or `npm test` fails with a spawn permission error (`spawn EPERM`) in restricted sandboxed execution environments.
- Trigger: Shell invocation of standard test processes inside the terminal sandbox.
- Workaround: Execute tests individually or run a single-process Node validation harness that bypasses multi-process spawning.

## Security Considerations

**Development Auth Bypass:**
- Risk: Local auth bypass configurations (`DEV_AUTH_BYPASS="true"`) could bypass security controls if misconfigured or deployed in production.
- Files: `auth.ts` (NextAuth configurations).
- Current mitigation: NextAuth guards require standard environment validation (`NEXTAUTH_URL` and `NEXTAUTH_SECRET`) in production modes.
- Recommendations: Explicitly restrict `DEV_AUTH_BYPASS` checks to evaluate only if `process.env.NODE_ENV !== "production"`.

**API Route Role Guards:**
- Risk: Route handlers must call role check guards (`requireSessionUser({ roles })`) manually. Any omitted guard on new administrative routes could lead to access leakage.
- Files: `app/api/**/*.ts` routes.
- Current mitigation: Strict review checklist requirements (Rule 5 / engineering quality standards).
- Recommendations: Implement a unified middleware-level route authorization check rather than relying on per-handler inline guards.

## Performance Bottlenecks

**Front-Loaded Generation Context:**
- Problem: The pairing engine reads all metrics, member snapshots, and historical pairs upfront (`getGenerationContext`) to avoid queries in loop cycles.
- File: `lib/server/repositories/pairing-repository.ts`.
- Cause: Designed to prevent N+1 query patterns during scoring.
- Scaling limit: As the historical sessions and member roster scale, this single query returns a growing dataset.
- Improvement path: Implement pagination or filter snapshots by a moving window of active members/recent sessions.

## Dependencies at Risk

**React 19 Compatibility:**
- Package: `react-hot-toast`, `next-auth` (v4).
- Risk: Potential peer dependency warnings or warning logs during library upgrades due to React 19 compatibility.
- Impact: Warnings in build outputs or minor styling deviations.
- Migration plan: Consider switching to `sonner` for modern React 19 toast feedback, and upgrading to Auth.js (NextAuth v5) in subsequent releases.

## Test Coverage Gaps

**Real Database Constraints Validation:**
- What's not tested: Real database constraints, unique indexes, and foreign keys.
- Risk: Stale proposal records, duplicate assignments, or constraint drift could pass stubs but fail in a real database transaction.
- Priority: Medium.
- Difficulty to test: Requires configuring a lightweight test database container (e.g. Dockerized PostgreSQL or temporary test schema) in the test run environment.

---

*Concerns audit: 2026-07-02*
*Update as issues are fixed or new ones discovered*
