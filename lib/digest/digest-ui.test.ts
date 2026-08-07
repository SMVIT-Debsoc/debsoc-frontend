import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Daily Debate Brief keeps the required editorial order and separate learning sections", async () => {
  const source = await readFile(new URL("../../components/digest/DailyDebateBrief.tsx", import.meta.url), "utf8");
  const order = [
    "PrepareYourLens",
    "CaseFile",
    "BuildYourDebate",
    "CoachCorner",
    "RebuttalDrills",
    "WeighingLanguage",
    "VocabularySession",
    "BeforeYouSpeak",
  ].map((name) => source.indexOf(`function ${name}`));
  assert.ok(order.every((index) => index >= 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.doesNotMatch(source, /Practice Before the Round/);
});

test("argument and rebuttal disclosures expose keyboard-safe ARIA state", async () => {
  const source = await readFile(new URL("../../components/digest/DailyDebateBrief.tsx", import.meta.url), "utf8");
  assert.match(source, /<button[\s\S]*aria-expanded=\{open\}/);
  assert.match(source, /aria-controls=\{contentId\}/);
  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /RebuttalDrills/);
});

test("DigestPanel has one real API path and no alternate data branch", async () => {
  const source = await readFile(new URL("../../components/digest/DigestPanel.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /useSearchParams|searchParams|NODE_ENV|dynamic import/i);
  assert.match(source, /fetch\("\/api\/digest"/);
  assert.match(source, /normalizeDigestResponse\(payload\)/);
});

test("Digest skeleton follows the editorial layout and exposes safe loading/retry semantics", async () => {
  const source = await readFile(new URL("../../components/digest/DigestSkeleton.tsx", import.meta.url), "utf8");
  const panel = await readFile(new URL("../../components/digest/DigestPanel.tsx", import.meta.url), "utf8");

  for (const component of [
    "DigestHeroSkeleton",
    "DigestSectionSkeleton",
    "DigestArticleSkeleton",
    "DigestDebateBuildSkeleton",
    "DigestRebuttalSkeleton",
    "DigestVocabularySkeleton",
  ]) {
    assert.match(source, new RegExp(`export function ${component}`));
  }
  assert.match(source, /aria-busy=\{loading\}/);
  assert.match(source, /Loading today’s debate digest/);
  assert.match(source, /onClick=\{onRetry\}/);
  assert.match(panel, /const DIGEST_LOAD_ERROR = "We couldn’t load today’s debate digest\."/);
  assert.match(panel, /const \[content, setContent\]/);
  assert.match(panel, /setRefreshing\(true\)/);
  assert.match(panel, /setError\(DIGEST_LOAD_ERROR\)/);
  assert.match(panel, /<DigestSkeleton loading=\{initialLoading\}/);
  assert.match(panel, /<DigestCards sections=\{parseDigest\(content\.text\)\}/);
});

test("refresh failures preserve real Digest content instead of replacing it", async () => {
  const source = await readFile(new URL("../../components/digest/DigestPanel.tsx", import.meta.url), "utf8");
  const errorStart = source.indexOf("setError(DIGEST_LOAD_ERROR)");
  assert.ok(errorStart >= 0);
  const catchBlock = source.slice(source.lastIndexOf("} catch", errorStart), source.indexOf("} finally", errorStart));

  assert.doesNotMatch(catchBlock, /setContent\(null\)/);
  assert.match(catchBlock, /setHasResolved\(true\)/);
});
