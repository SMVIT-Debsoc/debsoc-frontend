import { normalizeDigestSections, type DigestSection } from "./parse.ts";

const CANONICAL = {
  topic: "TOPIC FOR TODAY",
  preKnowledge: "PRE-KNOWLEDGE",
  wordBefore: "WORD BEFORE YOU READ",
  article: "TODAY'S ARTICLE / CASE",
  build: "YOUR DEBATING BUILD",
  rebuttals: "REBUTTAL DRILLS",
  weighing: "WEIGHING LANGUAGE TO USE",
  vocabulary: "VOCAB SESSION",
  reminders: "THINGS TO TAKE CARE",
} as const;

const COACH_SECTION_TITLES = new Set([
  "COACH NOTE",
  "COACH'S NOTE",
  "COACH LENS",
  "FRAMING",
  "CLASH",
  "MAIN CLASH",
  "JUDGE GUIDANCE",
  "JUDGE'S GUIDANCE",
  "JUDGE LENS",
  "JUDGE'S LENS",
]);

export type DigestBriefModel = {
  sections: DigestSection[];
  topicSection: DigestSection | null;
  topic: string;
  motion: string | null;
  preKnowledge: DigestSection[];
  wordBefore: DigestSection[];
  articles: DigestSection[];
  build: DigestSection[];
  coach: DigestSection[];
  rebuttals: DigestSection[];
  weighing: DigestSection[];
  vocabulary: DigestSection[];
  reminders: DigestSection[];
  economics: DigestSection[];
  additional: DigestSection[];
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function sectionsWithTitle(sections: DigestSection[], title: string): DigestSection[] {
  return sections.filter((section) => section.title.toUpperCase() === title);
}

function firstLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.split(/\r?\n/).map(clean).find(Boolean) ?? "";
}

function motionLine(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value
    .split(/\r?\n/)
    .map(clean)
    .find((line) => /^(?:motion|this house)\b/i.test(line));
  return candidate ? candidate.replace(/^motion\s*:\s*/i, "").trim() || null : null;
}

export function buildDigestBriefModel(value: unknown): DigestBriefModel {
  const sections = normalizeDigestSections(value).filter((section) => clean(section.body));
  const topicSection = sectionsWithTitle(sections, CANONICAL.topic)[0] ?? null;
  const knownTitles = new Set<string>(Object.values(CANONICAL));

  const preKnowledge = sectionsWithTitle(sections, CANONICAL.preKnowledge);
  const wordBefore = sectionsWithTitle(sections, CANONICAL.wordBefore);
  const articles = sectionsWithTitle(sections, CANONICAL.article);
  const build = sectionsWithTitle(sections, CANONICAL.build);
  const rebuttals = sectionsWithTitle(sections, CANONICAL.rebuttals);
  const weighing = sectionsWithTitle(sections, CANONICAL.weighing);
  const vocabulary = sectionsWithTitle(sections, CANONICAL.vocabulary);
  const reminders = sectionsWithTitle(sections, CANONICAL.reminders);
  const economics = sections.filter((section) => /ECONOM|FINANCE|MARKET|GDP|TAXATION|TRADE/i.test(section.title));
  const coach = sections.filter((section) => COACH_SECTION_TITLES.has(section.title.toUpperCase()));
  const additional = sections.filter((section) => {
    const normalizedTitle = section.title.toUpperCase();
    return !knownTitles.has(normalizedTitle) && !economics.includes(section) && !coach.includes(section);
  });

  return {
    sections,
    topicSection,
    topic: firstLine(topicSection?.body),
    motion: motionLine(topicSection?.body),
    preKnowledge,
    wordBefore,
    articles,
    build,
    coach,
    rebuttals,
    weighing,
    vocabulary,
    reminders,
    economics,
    additional,
  };
}
