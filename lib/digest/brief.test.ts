import assert from "node:assert/strict";
import test from "node:test";
import { buildDigestBriefModel } from "./brief.ts";
import { parseDigest } from "./parse.ts";

const completeDigest = `
TOPIC FOR TODAY
Universal Basic Income
MOTION: This House would provide a universal basic income.

PRE-KNOWLEDGE
The policy provides a regular payment to residents.

WORD BEFORE YOU READ
Universality: available to everyone.

TODAY'S ARTICLE / CASE
The article describes a local pilot and its results.

YOUR DEBATING BUILD
PROPOSITION: Explain why the policy is feasible.
OPPOSITION: Explain the cost and trade-offs.

COACH NOTE
Start with the burden of proof.

REBUTTAL DRILLS
If they say the policy is expensive: compare the alternative.

WEIGHING LANGUAGE TO USE
Impact comparison: The larger effect matters more.

VOCAB SESSION
Opportunity cost: The next-best alternative.

THINGS TO TAKE CARE
Do not confuse equality with equity.
`;

test("maps every canonical brief area without inventing content", () => {
  const model = buildDigestBriefModel(parseDigest(completeDigest));

  assert.equal(model.topic, "Universal Basic Income");
  assert.equal(model.motion, "This House would provide a universal basic income.");
  assert.equal(model.preKnowledge.length, 1);
  assert.equal(model.wordBefore.length, 1);
  assert.equal(model.articles.length, 1);
  assert.equal(model.build.length, 1);
  assert.equal(model.coach.length, 1);
  assert.equal(model.rebuttals.length, 1);
  assert.equal(model.weighing.length, 1);
  assert.equal(model.vocabulary.length, 1);
  assert.equal(model.reminders.length, 1);
});

test("uses the fallback heading when the topic is absent or empty", () => {
  assert.equal(buildDigestBriefModel(parseDigest("PRE-KNOWLEDGE\nContext")).topic, "");
  assert.equal(buildDigestBriefModel(parseDigest("TOPIC FOR TODAY\n\nPRE-KNOWLEDGE\nContext")).topic, "");
});

test("hides unavailable areas and keeps renamed headings out of canonical slots", () => {
  const model = buildDigestBriefModel(parseDigest("TODAY'S DEBATE TOPIC\nRenamed topic\n\nTODAY'S ARTICLE / CASE\nArticle"));

  assert.equal(model.topic, "");
  assert.equal(model.articles.length, 1);
  assert.equal(model.build.length, 0);
  assert.equal(model.additional.length, 1);
});

test("ignores malformed sections and unsupported input without throwing", () => {
  assert.doesNotThrow(() => buildDigestBriefModel(undefined));
  assert.deepEqual(buildDigestBriefModel(undefined).sections, []);
  assert.deepEqual(buildDigestBriefModel([
    { title: "", body: "content" },
    { title: "PRE-KNOWLEDGE", body: "Context", known: true },
    { title: "BROKEN", body: null },
  ]).preKnowledge.map((section) => section.body), ["Context"]);
});

test("retains long editorial and argument bodies as source content", () => {
  const longText = Array.from({ length: 180 }, (_, index) => `Sentence ${index + 1}.`).join(" ");
  const model = buildDigestBriefModel(parseDigest(`TODAY'S ARTICLE / CASE\n${longText}\n\nYOUR DEBATING BUILD\nCLAIM: ${longText}`));

  assert.match(model.articles[0]?.body ?? "", /Sentence 180\./);
  assert.match(model.build[0]?.body ?? "", /Sentence 180\./);
});

