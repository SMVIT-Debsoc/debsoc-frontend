import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getSparRankMarker, SPAR_SUCCESS_DURATION_MS, SPAR_SUCCESS_MESSAGE } from "./ui.ts";

test("keeps the SPAR success confirmation contract explicit", () => {
  assert.equal(SPAR_SUCCESS_MESSAGE, "SPAR submitted successfully.");
  assert.equal(SPAR_SUCCESS_DURATION_MS, 12_000);
});

test("maps the first three leaderboard ranks to accessible icon markers", () => {
  assert.deepEqual(getSparRankMarker(1), { kind: "trophy", label: "1st place", tone: "gold" });
  assert.deepEqual(getSparRankMarker(2), { kind: "medal", label: "2nd place", tone: "silver" });
  assert.deepEqual(getSparRankMarker(3), { kind: "medal", label: "3rd place", tone: "bronze" });
  assert.deepEqual(getSparRankMarker(4), { kind: "numeric", label: "4th place", tone: "numeric" });
});

test("keeps form reset and timer cleanup in the successful client flow", async () => {
  const source = await readFile(new URL("../../components/pairing/SparManagement.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(!response\.ok\)/);
  assert.match(source, /resetSparForm\(\)/);
  assert.match(source, /SPAR_SUCCESS_DURATION_MS/);
  assert.match(source, /clearTimeout/);
  assert.match(source, /SPAR_SUCCESS_MESSAGE/);
});
