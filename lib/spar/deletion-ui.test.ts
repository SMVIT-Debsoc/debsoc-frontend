import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("SPAR deletion uses an explicit in-product confirmation", async () => {
  const source = await readFile(new URL("../../components/pairing/SparManagement.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /window\.confirm/);
  assert.match(source, /role=\"alertdialog\"/);
  assert.match(source, /Keep Spar/);
  assert.match(source, /Delete Spar/);
  assert.match(source, /aria-label=\"Cancel deletion\"/);
  assert.match(source, /onKeyDown/);
  assert.match(source, /trigger\?\.focus\(\)/);
});

test("the delete trigger only opens confirmation and the confirmed action owns deletion", async () => {
  const source = await readFile(new URL("../../components/pairing/SparManagement.tsx", import.meta.url), "utf8");
  const triggerStart = source.indexOf("requestDelete(record.id, event.currentTarget)");
  const triggerEnd = source.indexOf("</button>", triggerStart);
  assert.ok(triggerStart >= 0 && triggerEnd > triggerStart);
  assert.doesNotMatch(source.slice(triggerStart, triggerEnd), /fetch\(/);
  assert.match(source, /onClick=\{confirmDelete\}/);
});
