import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDigestSections, parseDigest } from "./parse.ts";

const completeDigest = `
TOPIC FOR TODAY
Universal Basic Income

PRE-KNOWLEDGE
An introductory overview.

TODAY'S ARTICLE / CASE
The article body.

YOUR DEBATING BUILD
FRAMEWORK: Compare feasibility and impact.
GOVERNMENT: Explain the benefits.

REBUTTAL DRILLS
Claim: A claim to answer.

WEIGHING LANGUAGE TO USE
The larger impact matters more.

VOCAB SESSION
Opportunity cost: The next-best alternative.

THINGS TO TAKE CARE
Compare impacts before concluding.
`;

test("preserves the canonical digest sections", () => {
  const sections = parseDigest(completeDigest);
  assert.deepEqual(sections.map(({ title }) => title), [
    "TOPIC FOR TODAY",
    "PRE-KNOWLEDGE",
    "TODAY'S ARTICLE / CASE",
    "YOUR DEBATING BUILD",
    "REBUTTAL DRILLS",
    "WEIGHING LANGUAGE TO USE",
    "VOCAB SESSION",
    "THINGS TO TAKE CARE",
  ]);
  assert.equal(sections[0]?.body, "Universal Basic Income");
});

test("handles missing, empty, renamed, and malformed sections", () => {
  assert.doesNotThrow(() => parseDigest("PRE-KNOWLEDGE\nContext"));
  assert.deepEqual(parseDigest("TOPIC FOR TODAY\n\nPRE-KNOWLEDGE\nContext").map(({ title }) => title), ["PRE-KNOWLEDGE"]);
  assert.equal(parseDigest("TODAY'S DEBATE TOPIC\nA renamed heading")[0]?.known, false);
  assert.deepEqual(parseDigest(""), []);
  assert.deepEqual(parseDigest("  \n\t"), []);
  assert.deepEqual(parseDigest(undefined), []);
  assert.deepEqual(parseDigest(null), []);
  assert.deepEqual(parseDigest(42), []);
  assert.deepEqual(parseDigest({}), []);
  assert.deepEqual(parseDigest([]), []);
  assert.deepEqual(normalizeDigestSections([
    { title: "", body: "content" },
    { title: "Valid", body: "content", known: true },
    { title: "Malformed", body: null },
    null,
  ]), [{ title: "Valid", body: "content", known: true }]);
});
