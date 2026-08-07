import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readLogoutSource() {
  const source = await readFile(new URL("../../components/TechHeadDashboard/index.tsx", import.meta.url), "utf8");
  const start = source.indexOf("function TechHeadLogoutButton()");
  assert.ok(start >= 0);
  const end = source.indexOf("function SecondaryRetryButton", start);
  assert.ok(end > start);
  return source.slice(start, end);
}

test("TechHead logout requires an accurate circular hold and never normal-clicks out", async () => {
  const source = await readLogoutSource();

  assert.match(source, /const HOLD_DURATION_MS = 1350/);
  assert.match(source, /performance\.now\(\)/);
  assert.match(source, /requestAnimationFrame\(\(timestamp\) => updateProgressRef\.current\(timestamp\)\)/);
  assert.match(source, /cancelAnimationFrame/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerUp/);
  assert.match(source, /onPointerCancel/);
  assert.match(source, /onPointerLeave/);
  assert.match(source, /onBlur/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(source, /!event\.repeat/);
  assert.doesNotMatch(source, /onClick=/);
  assert.doesNotMatch(source, /HoldToConfirmLogout/);
});

test("TechHead logout uses a compact accessible circular progress control", async () => {
  const source = await readLogoutSource();

  assert.match(source, /h-12 w-12/);
  assert.match(source, /rounded-full/);
  assert.match(source, /viewBox="0 0 48 48"/);
  assert.match(source, /strokeDasharray=\{RING_CIRCUMFERENCE\}/);
  assert.match(source, /strokeDashoffset=\{progressOffset\}/);
  assert.match(source, /aria-label="Hold to log out"/);
  assert.match(source, /role="progressbar"/);
  assert.match(source, /aria-valuenow=\{Math\.round\(progress \* 100\)\}/);
  assert.match(source, /motion-reduce:transition-none/);
  assert.doesNotMatch(source, /flex-1/);
});

test("TechHead logout preserves the existing cleanup and redirect sequence", async () => {
  const source = await readLogoutSource();

  assert.match(source, /if \(confirmedRef\.current\) return/);
  assert.match(source, /clearKey\(\)/);
  assert.match(source, /clearAssistantSession\(\)/);
  assert.match(source, /signOut\(\{callbackUrl: "\/login"\}\)/);
  assert.match(source, /document\.addEventListener\("visibilitychange"/);
  assert.match(source, /document\.removeEventListener\("visibilitychange"/);
});
