import assert from "node:assert/strict";
import test from "node:test";
import { safeDebassErrorMessage } from "./safe-error.ts";

function debassError(message: string, kind: string) {
  const error = new Error(message);
  error.name = "DebassApiError";
  Object.assign(error, { kind });
  return error;
}

test("does not expose backend detail in any AI surface", () => {
  const rawDetail = "provider stack trace sk-or-v1-secret model=request-id";
  const cases = ["validation", "chat", "drill", "judge", "document"] as const;

  for (const context of cases) {
    const message = safeDebassErrorMessage(debassError(rawDetail, "request"), context);
    assert.notEqual(message, rawDetail);
    assert.doesNotMatch(message, /provider|stack trace|sk-or-v1|model|request-id/i);
  }
});

test("maps transport states to concise safe messages", () => {
  assert.equal(safeDebassErrorMessage(debassError("raw", "unauthorized"), "validation"), "Your API key could not be validated. Check it and try again.");
  assert.equal(safeDebassErrorMessage(debassError("raw", "timeout"), "chat"), "The request took too long. Please try again.");
  assert.equal(safeDebassErrorMessage(debassError("raw", "cancelled"), "judge"), "Request cancelled.");
  assert.equal(safeDebassErrorMessage(new Error("raw backend detail"), "drill"), "DebSoc AI couldn't prepare the drill analysis. Please try again.");
});
