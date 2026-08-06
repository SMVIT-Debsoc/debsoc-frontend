import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDigestResponse } from "./response.ts";

test("accepts a valid digest response and explicit empty response", () => {
  assert.deepEqual(normalizeDigestResponse({ digest: null }), { digest: null });
  assert.deepEqual(normalizeDigestResponse({ digest: { text: "CONTENT", updatedAt: "2026-08-06T00:00:00.000Z" } }), {
    digest: { text: "CONTENT", updatedAt: "2026-08-06T00:00:00.000Z" },
  });
});

test("rejects malformed digest metadata before it reaches render state", () => {
  const invalidResponses: unknown[] = [
    {},
    { digest: undefined },
    { digest: { text: null, updatedAt: "2026-08-06T00:00:00.000Z" } },
    { digest: { text: 42, updatedAt: "2026-08-06T00:00:00.000Z" } },
    { digest: { text: [], updatedAt: "2026-08-06T00:00:00.000Z" } },
    { digest: { text: {}, updatedAt: "2026-08-06T00:00:00.000Z" } },
    { digest: { text: "CONTENT", updatedAt: "not-a-date" } },
    { digest: [] },
    { digest: 42 },
  ];

  for (const response of invalidResponses) {
    assert.equal(normalizeDigestResponse(response), null);
  }
});
