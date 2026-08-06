import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { formatSparScore, isValidSparScoreSet, parseSparScore, SCORE_VALIDATION_MESSAGE } from "./score.ts";

test("accepts backend-valid whole and half-point scores without rounding", () => {
  for (const [input, expected] of [["50", 50], ["50.5", 50.5], ["78.5", 78.5], ["99.5", 99.5], ["100", 100]] as const) {
    assert.equal(parseSparScore(input), expected);
  }
  assert.equal(parseSparScore(" 78.5\n"), 78.5);
  assert.equal(formatSparScore(50), "50");
  assert.equal(formatSparScore(78.5), "78.5");
});

test("rejects invalid, out-of-contract, and over-precise scores", () => {
  for (const input of ["", "abc", "0", "49.5", "100.5", "78.25", "50.25", "-0.5"]) {
    assert.equal(parseSparScore(input), null, input);
  }
  assert.equal(SCORE_VALIDATION_MESSAGE, "Score must be between 50 and 100 in 0.5-point increments.");
});

test("blocks a request whenever any submitted score is invalid", () => {
  assert.equal(isValidSparScoreSet(["78.5"]), true);
  assert.equal(isValidSparScoreSet(["78.5", "99.5", "100"]), true);
  assert.equal(isValidSparScoreSet(["78.5", ""]), false);
  assert.equal(isValidSparScoreSet(["100.5"]), false);
});

test("keeps the SPAR score UI on the numeric input path", async () => {
  const source = await readFile(new URL("../../components/pairing/SparManagement.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /ElasticSlider|type=["']range["']|Fine-tune score/);
  assert.match(source, /type=["']number["']/);
});
