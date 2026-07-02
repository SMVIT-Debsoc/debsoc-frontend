# Codebase Concerns

**Analysis Date:** 2026-07-02

## Verification Status

- Overall status: `Mostly verified`
- Trust level: good as a short risk register, but each item should be re-checked before action
- Use rule:
  - use this file to spot likely trouble areas fast
  - confirm current code state before fixing or redesigning anything

## Verified High-Value Concerns

### Participant Reference Complexity
- The schema uses participant references across separate `Member`, `cabinet`, and `President` identities rather than one unified participant table
- This increases query and validation complexity across attendance, role assignment, pairing, and metrics work
- Best use: remember this before changing schema or participant resolution logic

### Manual Test Stubbing
- Tests rely on inline object stubs and explicit call tracking rather than a mocking framework
- This keeps dependencies light but makes refactors more verbose and brittle
- Best use: expect manual mock maintenance when changing repositories or services

### Front-Loaded Generation Context
- Pairing internals use `getGenerationContext` to load context up front
- This is good for avoiding query-in-loop problems, but it can become heavy as history grows
- Best use: watch query size and projection scope when modifying generation context

### Auth Bypass Risk
- `DEV_AUTH_BYPASS` logic exists in local session handling
- This is useful for local development but should always be treated as a deployment-sensitive path
- Best use: re-check production safety whenever auth logic changes

### Route Guard Reliance
- Access control depends heavily on explicit guard usage such as `requireSessionUser`
- Missing a guard on a new route is a real class of risk
- Best use: verify role protection on every new admin or scoring route

## Verified Dependency Watchpoints

- `next-auth` is present and central to auth flow
- `react-hot-toast` is present in UI components
- These are not necessarily problems today, but they are reasonable watchpoints during upgrades

## Environment-Specific Caveats

- Sandbox-related test spawning failures may vary by execution environment
- Build and type-check behavior can be affected by generated `.next/**` files
- Best use: do not treat environment-specific failures as universal repo bugs without re-checking

## Re-check Before Relying On

- whether a concern is still active today
- whether a mitigation is already implemented
- whether a dependency warning is theoretical or currently happening

---

*Trimmed to the concerns most likely to affect implementation decisions quickly.*
