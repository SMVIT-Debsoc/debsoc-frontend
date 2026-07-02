# Testing Patterns

**Analysis Date:** 2026-07-02

## Verification Status

- Overall status: `Mostly verified`
- Trust level: good for testing orientation, but command coverage must always be checked in `package.json`
- Use rule:
  - trust the patterns here
  - trust `package.json` for exact runnable commands

## Verified Runner Setup

- Test runner: Node native test runner
- Execution mode: `node --experimental-strip-types --test`
- Assertion library: `node:assert/strict`
- No dedicated Jest/Vitest-style mocking framework is present in the repo

## Verified Package Scripts

- `npm run test:repositories`
- `npm run test:services`
- `npm run test:pairing-internals`

## Verified Test File Areas

- `lib/server/repositories/repositories.test.ts`
- `lib/server/sessions/services.test.ts`
- `lib/server/pairing/pairing-engine.test.ts`
- `lib/server/scoring/scoring-services.test.ts`
- `lib/server/realtime/realtime.test.ts`

## Testing Style

- Tests are colocated near the server domain they cover
- Mocks are generally plain objects and manual stubs
- Call verification is often done with local arrays and explicit assertions
- Test data is usually created inline or with small helper factories

## Known Caveats

- Package scripts do not currently cover every existing test area automatically
- Sandbox or restricted environments may behave differently when spawning test processes
- Exact coverage should be verified before assuming a domain is included in a script

## Working Rule

When using this file:
- open `package.json` first for exact commands
- use this file to remember test layout and style
- re-check real test filenames before adding or moving suites

---

*Trimmed to verified runner, script, file-location, and style facts.*
