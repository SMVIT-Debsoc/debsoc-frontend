import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DEBASS_KEY_PRIVACY_COPY } from "./privacy.ts";

test("privacy copy describes local storage, explicit transmission, and no automatic validation", () => {
  assert.match(DEBASS_KEY_PRIVACY_COPY, /Stored in this browser/);
  assert.match(DEBASS_KEY_PRIVACY_COPY, /Not checked automatically on page load/);
  assert.match(DEBASS_KEY_PRIVACY_COPY, /only when you explicitly validate or use DebSoc AI/);
  assert.match(DEBASS_KEY_PRIVACY_COPY, /Remove it anytime/);
  assert.doesNotMatch(DEBASS_KEY_PRIVACY_COPY, /never uploaded|never sent/i);
});

test("remembered keys are restored without an automatic validation call", async () => {
  const source = await readFile(new URL("../../components/pairing/DebassWorkspaceProvider.tsx", import.meta.url), "utf8");
  const restoreStart = source.indexOf("const rememberedKey = readRememberedDebassKey();");
  const healthStart = source.indexOf("const refreshHealth = useCallback");
  assert.ok(restoreStart >= 0 && healthStart > restoreStart);
  assert.doesNotMatch(source.slice(restoreStart, healthStart), /validateApiKey/);
});
