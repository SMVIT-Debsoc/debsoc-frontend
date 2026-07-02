# Testing Patterns

**Analysis Date:** 2026-07-02

## Test Framework

**Runner:**
- Node.js Native Test Runner (`node --test`).
- Executes TypeScript test files directly using the `--experimental-strip-types` flag, bypassing manual build steps.

**Assertion Library:**
- Node.js strict assertion library (`node:assert/strict`).
- Common Matchers:
  - `assert.ok(value)` - Asserts truthiness.
  - `assert.equal(actual, expected)` - Strict equality checking.
  - `assert.deepEqual(actual, expected)` - Deep object equality checking.
  - `assert.rejects(promise, error)` - Asserts async promise rejection.

**Run Commands:**
```bash
npm run test:repositories       # Run repository database access tests
npm run test:services           # Run session and attendance service tests
npm run test:pairing-internals  # Run core pairing engine and scoring tests
```

## Test File Organization

**Location:**
- Test files are collocated directly inside their domain folders under `lib/server/`.
- No separate global `tests/` directory is used.

**Naming:**
- Feature/folder unit tests: `*.test.ts` (e.g., `repositories.test.ts`, `services.test.ts`, `pairing-internals.test.ts`, `realtime.test.ts`).

**Structure:**
```
lib/
  server/
    repositories/
      pairing-repository.ts
      repositories.test.ts      # Tests all repositories
    pairing/
      engine.ts
      pairing-engine.test.ts    # Tests pairing engine flows
```

## Test Structure

**Suite Organization:**
Tests use the native `test()` wrapper exported by `node:test`.

```typescript
import test from "node:test";
import assert from "node:assert/strict";

test("descriptive test case name", async () => {
  // 1. Arrange
  const input = { id: "test-id" };

  // 2. Act
  const result = processInput(input);

  // 3. Assert
  assert.equal(result.status, "success");
});
```

## Mocking

**Approach:**
- **No Mocking Framework:** Mocking libraries (like Sinon, Jest mocks, or Vitest vi) are NOT used.
- **Manual Stubbing:** Mocks are written as plain JavaScript objects matching the expected interface (e.g. mock Prisma client).
- **Call Verification:** To verify function calls or arguments, tests push call signatures or call parameters into a local `calls` array and assert on that array.

**Mocking Example (Prisma client stub):**
```typescript
test("gets generation context correctly", async () => {
  const calls: string[] = [];

  const mockClient = {
    debateSession: {
      findUnique: async (args: any) => {
        calls.push("findUnique");
        assert.ok(args.select);
        return { id: "session-1", motionText: "This house would..." };
      }
    }
  };

  const repository = createPairingRepository(mockClient as any);
  await repository.getGenerationContext("session-1");

  assert.deepEqual(calls, ["findUnique"]);
});
```

## Fixtures and Factories

**Data Preparation:**
- Test data is created in-line inside the test files.
- Mock objects and configurations are generated on-the-fly using simple helper factory functions or in-test declarations.

**Factory Pattern:**
```typescript
function createTestProposal(overrides?: Partial<PersistGeneratedProposalInput>) {
  return {
    sessionId: "session-1",
    proposalVersion: 1,
    proposalScore: 82.5,
    scoreBreakdownJson: {},
    roomAssignments: [],
    unassignedParticipants: [],
    ...overrides
  };
}
```

## Test Types

**Unit Tests:**
- Tests internal logic (e.g. `fallback.ts`, `objectives.ts`, `leftovers.ts`) by supplying mock context.
- Fast execution (< 50ms per test).

**Integration Tests:**
- Tests interactions between repositories, services, and stubs (e.g. `repositories.test.ts` mock-integrating with Prisma models).
- Tests session and scoring services state transitions.

---

*Testing analysis: 2026-07-02*
*Update when test patterns change*
