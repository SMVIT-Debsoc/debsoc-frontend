export type LocalChatFixture = {
  content: string;
  citations: string[];
};

export type LocalDrillFixture = {
  response: string;
  feedback: string;
};

export type LocalJudgeFixture = {
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
};

const LOCAL_CHAT_SOURCES = [
  "Local preview source · DEBSOC debate handbook",
  "Local preview source · Parliamentary debate notes",
];

export const LOCAL_CHAT_SUGGESTIONS = [
  "How do I build a clear rebuttal?",
  "What makes a strong point of information?",
  "Give me a practice structure for a policy motion.",
];

export const LOCAL_DRILL_PERSPECTIVES = [
  { id: "government", label: "Government", value: "Government" },
  { id: "opposition", label: "Opposition", value: "Opposition" },
  { id: "adjudicator", label: "Adjudicator", value: "Adjudicator" },
];

export const LOCAL_DRILL_STANCES = [
  { id: "constructive", label: "Constructive case", value: "Constructive case" },
  { id: "rebuttal", label: "Rebuttal case", value: "Rebuttal case" },
  { id: "extension", label: "Extension case", value: "Extension case" },
];

export const LOCAL_JUDGE_FORMATS = [
  { id: "bp", label: "British Parliamentary", value: "British Parliamentary" },
  { id: "ap", label: "Asian Parliamentary", value: "Asian Parliamentary" },
];

export function getLocalChatFixture(message: string): LocalChatFixture {
  const prompt = message.trim() || "your debate question";
  return {
    content: `## A practical way to approach it

For **${prompt}**, start with one clear claim and make the mechanism explicit. A useful debate answer usually moves in this order:

- **Claim:** state what you want the adjudicator to believe.
- **Mechanism:** explain why the change produces that outcome.
- **Impact:** show who is affected, how much, and why it matters.
- **Comparison:** explain why your side is preferable to the alternative.

Then add a short rebuttal: identify the other side's strongest assumption, test it against your mechanism, and finish by weighing the larger impact. This is a deterministic local preview response for testing the conversation layout; it is **not connected to Debass or a live RAG index**.

### Quick practice prompt

Try delivering the argument in 45 seconds, then use the remaining time to answer: *what would have to be true for the opposing side to win?*`,
    citations: LOCAL_CHAT_SOURCES,
  };
}

export function getLocalDrillFixture(input: {
  motion: string;
  perspective: string;
  stance: string;
  response: string;
}): LocalDrillFixture {
  const motion = input.motion.trim() || "the selected motion";
  const response = input.response.trim() || "your draft argument";
  return {
    response,
    feedback: `### Local development critique

Your **${input.perspective.toLowerCase()}** response on **${motion}** has a useful starting point. The draft currently argues that:

- the main claim is understandable;
- the ${input.stance.toLowerCase()} framing gives the speech direction;
- the impact needs a more concrete comparison against the opposing model.

### Strengths

- The response commits to a clear position instead of listing disconnected ideas.
- The mechanism can be developed into a persuasive explanation.

### Weaknesses

- The causal chain is still compressed; explain the intermediate step.
- The speech needs a direct answer to the strongest likely rebuttal.

### Next improvement

Add one stakeholder, one time horizon, and one comparison sentence. Then close with why that impact should matter more than the opponent's best case.

This is a deterministic **Development mock response** for UI testing. It is **not connected to Debass or a live RAG service**.`,
  };
}

export function getLocalJudgeFixture(input: {
  motion: string;
  format: string;
  speakerInfo: string;
  argument: string;
}): LocalJudgeFixture {
  const motion = input.motion.trim() || "the selected motion";
  return {
    score: 76,
    reasoning: `The argument on **${motion}** is coherent and judgeable. It presents a plausible mechanism and a clear direction, but the comparison to the other side is not yet fully developed. The ${input.format.toLowerCase()} context is acknowledged for this local preview only.`,
    strengths: [
      "Clear central claim",
      "Plausible causal mechanism",
      input.speakerInfo.trim() ? "Speaker context is easy to follow" : "Argument is easy to follow",
    ],
    weaknesses: [
      "Limited comparative weighing",
      "One more concrete example would improve credibility",
      input.argument.trim() ? "The conclusion could crystallize the impact" : "Add a speech before judging",
    ],
  };
}
