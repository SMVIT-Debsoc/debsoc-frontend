"use client";

import {
  BookOpenText,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  Gavel,
  Lightbulb,
  MessageCircle,
  Newspaper,
  Scale,
  Sparkles,
  Swords,
  Target,
  type LucideIcon,
} from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { buildDigestBriefModel } from "@/lib/digest/brief";
import type { DigestSection } from "@/lib/digest/parse";

export type DailyDebateBriefProps = {
  sections: DigestSection[];
  updatedAt: Date;
  refreshing?: boolean;
};

type StructuredItem = { label: string; body: string };
type VocabularyEntry = {
  word: string;
  meaning?: string;
  why?: string;
  usage?: string;
  example?: string;
  fit?: string;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function paragraphs(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function lines(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function wordCount(value: unknown): number {
  if (typeof value !== "string" || !value.trim()) return 0;
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function readingTime(value: unknown): string | null {
  const count = wordCount(value);
  return count > 0 ? `${Math.max(1, Math.ceil(count / 200))} min read` : null;
}

function structuredItems(value: unknown): StructuredItem[] {
  if (typeof value !== "string") return [];

  const items: StructuredItem[] = [];
  let current: StructuredItem | null = null;
  for (const line of value.split(/\r?\n/)) {
    const match = line.trim().match(/^(?:[-*•]\s*)?([^:]{2,54}):\s*(.*)$/);
    const label = clean(match?.[1]);
    const looksLikeLabel = Boolean(label) && (
      label === label.toUpperCase() ||
      /^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,5}$/.test(label)
    );

    if (match && looksLikeLabel) {
      current = { label, body: clean(match[2]) };
      items.push(current);
      continue;
    }

    if (current && line.trim()) {
      current.body = `${current.body}${current.body ? "\n" : ""}${line.trim()}`;
    }
  }

  return items.filter((item) => clean(item.body));
}

function displayLabel(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function BodyText({ value, editorial = false }: { value: unknown; editorial?: boolean }) {
  const blocks = paragraphs(value);
  if (blocks.length === 0) return null;

  return (
    <div className={`max-w-[72ch] space-y-4 break-words text-foreground/85 ${editorial ? "font-serif text-base leading-8 sm:text-lg" : "text-base leading-7"}`}>
      {blocks.map((block, index) => (
        <p key={`${block.slice(0, 28)}-${index}`} className="whitespace-pre-line">{block}</p>
      ))}
    </div>
  );
}

function BriefSection({
  title,
  icon: Icon,
  children,
  tone = "default",
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  tone?: "default" | "warm" | "amber";
}) {
  const headingId = `digest-section-${useId().replace(/:/g, "")}`;
  const toneClass = tone === "amber"
    ? "border-chart-4/40 bg-chart-4/10"
    : tone === "warm"
      ? "border-chart-4/30 bg-chart-4/5"
      : "border-border bg-card/80";

  return (
    <section aria-labelledby={headingId} className={`rounded-[24px] border p-5 shadow-sm backdrop-blur-sm sm:p-7 ${toneClass}`}>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={19} aria-hidden="true" />
        </span>
        <h2 id={headingId} className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Disclosure({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = `digest-disclosure-${useId().replace(/:/g, "")}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background/45">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-foreground transition duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="break-words">{label}</span>
        <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div id={contentId} className="border-t border-border px-4 py-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-reduce:animate-none">{children}</div>}
    </div>
  );
}

function DetailList({ items }: { items: StructuredItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{displayLabel(item.label)}</p>
          <div className="mt-2"><BodyText value={item.body} editorial /></div>
        </div>
      ))}
    </div>
  );
}

function StructuredDisclosure({ item, defaultOpen = false }: { item: StructuredItem; defaultOpen?: boolean }) {
  const details = structuredItems(item.body);
  return (
    <Disclosure label={displayLabel(item.label)} defaultOpen={defaultOpen}>
      {details.length > 0 ? <DetailList items={details} /> : <BodyText value={item.body} editorial />}
    </Disclosure>
  );
}

export function DailyBriefTopBar({ date, refreshing }: { date: string | null; refreshing: boolean }) {
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border py-3 text-xs font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles size={14} aria-hidden="true" />Daily Debate Brief</span>
      <div className="flex items-center gap-3 text-right">
        {date && <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" />{date}</span>}
        {refreshing && <span role="status" aria-live="polite">Refreshing…</span>}
      </div>
    </div>
  );
}

function TopicHero({ model }: { model: ReturnType<typeof buildDigestBriefModel> }) {
  const lensItems = [
    ...structuredItems(model.topicSection?.body),
    ...model.build.flatMap((section) => structuredItems(section.body)),
    ...model.coach.flatMap((section) => structuredItems(section.body)),
  ].filter((item) => /type|burden|clash|ask|stakeholder|framework|definition|criterion|priority/i.test(item.label));

  return (
    <header className="border-b border-border py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Daily preparation brief</p>
      <h1 className="mt-4 max-w-4xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {model.topic ? <><span className="block">Today’s Debate Topic</span><span className="mt-3 block font-serif font-normal leading-tight text-primary">{model.topic}</span></> : "Today’s Debate Digest"}
      </h1>
      {lensItems.length > 0 && (
        <div className="mt-7 flex flex-wrap gap-2" aria-label="Round Lens">
          {lensItems.map((item, index) => <span key={`${item.label}-${index}`} className="inline-flex max-w-full items-start gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs leading-5 text-foreground"><span className="font-semibold text-primary">{displayLabel(item.label)}:</span><span className="break-words">{item.body}</span></span>)}
        </div>
      )}
      {model.motion && <div className="mt-8 max-w-3xl rounded-2xl border border-primary/25 bg-primary/5 p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Motion we are debating</p><p className="mt-3 font-serif text-lg leading-8 text-foreground sm:text-xl">{model.motion}</p></div>}
    </header>
  );
}

function WordBeforeYouRead({ sections }: { sections: DigestSection[] }) {
  const entries = sections.flatMap((section) => lines(section.body).map((line) => {
    const match = line.match(/^(?:[-*•]\s*)?([^:—–-]{2,64})\s*[:—–-]\s*(.+)$/);
    return match ? { word: clean(match[1]), meaning: clean(match[2]) } : null;
  })).filter((entry): entry is { word: string; meaning: string } => Boolean(entry?.word && entry.meaning));

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Word before you read</p>
      {entries.length > 0 ? <div className="space-y-3">{entries.map((entry, index) => <div key={`${entry.word}-${index}`} className="rounded-2xl border border-chart-4/30 bg-chart-4/10 p-4"><p className="font-serif text-xl font-semibold text-foreground">{entry.word}</p><p className="mt-2 font-serif text-base leading-7 text-foreground/85">{entry.meaning}</p></div>)}</div> : <BodyText value={sections.map((section) => section.body).join("\n\n")} editorial />}
    </div>
  );
}

function PrepareYourLens({ preKnowledge, wordBefore }: { preKnowledge: DigestSection[]; wordBefore: DigestSection[] }) {
  if (preKnowledge.length === 0 && wordBefore.length === 0) return null;
  const split = preKnowledge.length > 0 && wordBefore.length > 0;

  return (
    <BriefSection title="Prepare Your Lens" icon={Brain} tone="warm">
      <div className={`grid gap-7 ${split ? "lg:grid-cols-[1.15fr_0.85fr]" : "grid-cols-1"}`}>
        {preKnowledge.length > 0 && <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Background knowledge</p><div className="space-y-5">{preKnowledge.map((section, index) => <BodyText key={`${section.title}-${index}`} value={section.body} editorial />)}</div></div>}
        {wordBefore.length > 0 && <WordBeforeYouRead sections={wordBefore} />}
      </div>
    </BriefSection>
  );
}

function CaseFile({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  const articleText = sections.map((section) => section.body).join("\n\n");
  const evidence = sections.flatMap((section) => structuredItems(section.body)).filter((item) => /evidence|key takeaway|detail/i.test(item.label));

  return (
    <BriefSection title="Today’s Case File" icon={Newspaper}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Today’s case file</p>
      {readingTime(articleText) && <div className="mt-3 text-xs text-muted-foreground">{readingTime(articleText)}</div>}
      <div className={`mt-7 grid gap-7 ${evidence.length > 0 ? "lg:grid-cols-[minmax(0,1fr)_minmax(220px,.34fr)]" : "grid-cols-1"}`}>
        <div className="space-y-5">{sections.map((section, index) => <BodyText key={`${section.title}-${index}`} value={section.body} editorial />)}</div>
        {evidence.length > 0 && <aside className="h-fit rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Evidence to use</p><div className="mt-3 space-y-4">{evidence.map((item, index) => <div key={`${item.label}-${index}`}><p className="text-xs font-semibold text-foreground">{displayLabel(item.label)}</p><div className="mt-1 text-sm leading-6 text-foreground/80"><BodyText value={item.body} /></div></div>)}</div></aside>}
      </div>
    </BriefSection>
  );
}

function FramingStrip({ items }: { items: StructuredItem[] }) {
  if (items.length === 0) return null;
  return <div className="grid gap-3 sm:grid-cols-2">{items.map((item, index) => <div key={`${item.label}-${index}`} className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{displayLabel(item.label)}</p><div className="mt-2"><BodyText value={item.body} /></div></div>)}</div>;
}

function ArgumentColumn({ title, icon: Icon, items }: { title: string; icon: LucideIcon; items: StructuredItem[] }) {
  if (items.length === 0) return null;
  return <div className="min-w-0"><div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon size={17} className="text-primary" aria-hidden="true" />{title}</div><div className="mt-3 space-y-3">{items.map((item, index) => <StructuredDisclosure key={`${item.label}-${index}`} item={item} defaultOpen={index === 0} />)}</div></div>;
}

function BuildYourDebate({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  const items = sections.flatMap((section) => structuredItems(section.body));
  if (items.length === 0) return <BriefSection title="Build Your Debate" icon={Target}><BodyText value={sections.map((section) => section.body).join("\n\n")} editorial /></BriefSection>;

  const framing = items.filter((item) => /motion|definition|framework|burden|stakeholder|clash|criterion/i.test(item.label));
  const judgeLens = items.filter((item) => /judge|weigh|clash|criterion/i.test(item.label));
  const proposition = items.filter((item) => /proposition|government|supporting|for the motion/i.test(item.label));
  const opposition = items.filter((item) => /opposition|challenging|against the motion/i.test(item.label));
  const excluded = new Set([...framing, ...judgeLens]);
  const remaining = items.filter((item) => !excluded.has(item) && !proposition.includes(item) && !opposition.includes(item));
  const grouped = proposition.length > 0 || opposition.length > 0;

  return (
    <BriefSection title="Build Your Debate" icon={Target}>
      <div className="space-y-7">
        <FramingStrip items={framing} />
        {grouped && <div className="grid gap-7 border-t border-border pt-6 lg:grid-cols-2"><ArgumentColumn title="Proposition" icon={Target} items={proposition} /><ArgumentColumn title="Opposition" icon={Scale} items={opposition} /></div>}
        {!grouped && remaining.length > 0 && <div className="space-y-3">{remaining.map((item, index) => <StructuredDisclosure key={`${item.label}-${index}`} item={item} defaultOpen={index === 0} />)}</div>}
        {grouped && remaining.length > 0 && <div className="space-y-3 border-t border-border pt-6">{remaining.map((item, index) => <StructuredDisclosure key={`${item.label}-${index}`} item={item} />)}</div>}
        {judgeLens.length > 0 && <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Gavel size={17} className="text-primary" aria-hidden="true" />Judge’s Lens</div><div className="mt-4 space-y-4"><DetailList items={judgeLens} /></div></div>}
      </div>
    </BriefSection>
  );
}

function CoachCorner({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  return <BriefSection title="Coach’s Corner" icon={Lightbulb} tone="warm"><div className="space-y-3">{sections.map((section, index) => <div key={`${section.title}-${index}`} className={`rounded-2xl border border-chart-4/25 bg-background/40 p-4 ${index === 0 ? "sm:p-5" : ""}`}><p className="text-xs font-semibold uppercase tracking-[0.15em] text-chart-4">{displayLabel(section.title)}</p><div className="mt-3"><BodyText value={section.body} editorial /></div></div>)}</div></BriefSection>;
}

function RebuttalCard({ section, index }: { section: DigestSection; index: number }) {
  const items = structuredItems(section.body);
  if (items.length === 0) return <article className="rounded-2xl border border-border bg-background/45 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Rebuttal drill {index + 1}</p><div className="mt-3"><BodyText value={section.body} editorial /></div></article>;

  const opponent = items.find((item) => /if they say|opponent|claim|they argue|argument/i.test(item.label));
  const response = items.find((item) => /your response|rebuttal|counter|response/i.test(item.label));
  const explanation = items.find((item) => /how to explain|explanation|mechanism|detail/i.test(item.label));
  const matched = new Set([opponent, response, explanation].filter((item): item is StructuredItem => Boolean(item)));
  const remaining = items.filter((item) => !matched.has(item));

  return <article className="rounded-2xl border border-border bg-background/45 p-4 sm:p-5"><div className="space-y-4">{opponent && <div className="rounded-xl border border-border bg-muted/40 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">If they say this…</p><div className="mt-2"><BodyText value={opponent.body} editorial /></div></div>}{response && <div className="rounded-xl border border-primary/25 bg-primary/5 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Your response</p><div className="mt-2"><BodyText value={response.body} editorial /></div></div>}{explanation && <Disclosure label="How to explain it"><BodyText value={explanation.body} editorial /></Disclosure>}{remaining.map((item, itemIndex) => <Disclosure key={`${item.label}-${itemIndex}`} label={displayLabel(item.label)}><BodyText value={item.body} editorial /></Disclosure>)}</div></article>;
}

function RebuttalDrills({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  return <BriefSection title="Rebuttal Drills" icon={Swords}><p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">Use these real prompts to practise answering the strongest version of the other side.</p><div className="mt-5 grid gap-4">{sections.map((section, index) => <RebuttalCard key={`${section.title}-${index}`} section={section} index={index} />)}</div></BriefSection>;
}

function WeighingLanguage({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  const items = sections.flatMap((section) => structuredItems(section.body));
  const phrases = items.length > 0 ? items : sections.flatMap((section) => lines(section.body).map((body) => ({ label: "", body })));
  const valid = phrases.filter((item) => clean(item.body));
  if (valid.length === 0) return null;

  return <BriefSection title="Weighing Language to Use" icon={Scale}><div className="grid gap-3 sm:grid-cols-2">{valid.map((item, index) => <div key={`${item.label}-${index}`} className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><MessageCircle size={16} className="text-primary" aria-hidden="true" />{item.label && <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{displayLabel(item.label)}</p>}<p className="mt-2 font-serif text-base leading-7 text-foreground">{item.body}</p></div>)}</div></BriefSection>;
}

function vocabularyEntries(sections: DigestSection[]): VocabularyEntry[] {
  return sections.flatMap((section) => {
    const rows = structuredItems(section.body);
    const hasWordBlock = rows.some((item) => /^(word|term|vocabulary)$/i.test(item.label));
    if (hasWordBlock) {
      const entry: VocabularyEntry = { word: "" };
      for (const row of rows) {
        if (/^(word|term|vocabulary)$/i.test(row.label)) entry.word = clean(row.body);
        else if (/meaning|definition/i.test(row.label)) entry.meaning = clean(row.body);
        else if (/why|matters|relevance|fit/i.test(row.label)) entry.fit = clean(row.body);
        else if (/usage|use/i.test(row.label)) entry.usage = clean(row.body);
        else if (/example/i.test(row.label)) entry.example = clean(row.body);
      }
      return entry.word ? [entry] : [];
    }

    return lines(section.body).flatMap((line) => {
      const match = line.match(/^(?:[-*•]\s*)?([^:—–-]{2,64})\s*[:—–-]\s*(.+)$/);
      return match ? [{ word: clean(match[1]), meaning: clean(match[2]) }] : [];
    });
  }).filter((entry) => Boolean(entry.word && (entry.meaning || entry.why || entry.usage || entry.example || entry.fit)));
}

function VocabularySession({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  const entries = vocabularyEntries(sections);
  return <BriefSection title="Vocabulary Session" icon={BookOpenText}>{entries.length > 0 ? <div className="grid gap-4 sm:grid-cols-2">{entries.map((entry, index) => <article key={`${entry.word}-${index}`} className="rounded-2xl border border-border bg-background/45 p-4"><p className="font-serif text-xl font-semibold text-foreground">{entry.word}</p>{entry.meaning && <p className="mt-3 text-sm leading-6 text-foreground/85"><span className="font-semibold text-foreground">Meaning. </span>{entry.meaning}</p>}{entry.fit && <p className="mt-3 text-sm leading-6 text-foreground/85"><span className="font-semibold text-foreground">Why it matters. </span>{entry.fit}</p>}{entry.usage && <p className="mt-3 text-sm leading-6 text-foreground/85"><span className="font-semibold text-foreground">Debate usage. </span>{entry.usage}</p>}{entry.example && <p className="mt-3 font-serif text-sm leading-6 text-foreground/80"><span className="font-sans font-semibold text-foreground">Example. </span>{entry.example}</p>}</article>)}</div> : <BodyText value={sections.map((section) => section.body).join("\n\n")} editorial />}</BriefSection>;
}

function BeforeYouSpeak({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  const reminders = sections.flatMap((section) => lines(section.body));
  if (reminders.length === 0) return null;
  return <BriefSection title="Before You Speak" icon={ClipboardList} tone="amber"><div className="grid gap-3 sm:grid-cols-2">{reminders.map((reminder, index) => <div key={`${reminder.slice(0, 28)}-${index}`} className="rounded-2xl border border-chart-4/35 bg-background/45 p-4 font-serif text-base leading-7 text-foreground"><Check size={17} className="mb-2 text-chart-4" aria-hidden="true" />{reminder}</div>)}</div></BriefSection>;
}

function AdditionalBriefNotes({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  return <BriefSection title="Additional Brief Notes" icon={FileText}><div className="space-y-5">{sections.map((section, index) => <div key={`${section.title}-${index}`}><h3 className="text-sm font-semibold text-foreground">{displayLabel(section.title)}</h3><div className="mt-2"><BodyText value={section.body} editorial /></div></div>)}</div></BriefSection>;
}

export default function DailyDebateBrief({ sections, updatedAt, refreshing = false }: DailyDebateBriefProps) {
  const model = buildDigestBriefModel(sections);
  const date = updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" }).format(updatedAt)
    : null;

  return (
    <main className="mx-auto w-full max-w-[1040px] px-4 pb-16 sm:px-6 lg:px-8">
      <DailyBriefTopBar date={date} refreshing={refreshing} />
      <TopicHero model={model} />
      {model.sections.length === 0 ? (
        <section className="mx-auto flex min-h-[42vh] max-w-md flex-col items-center justify-center px-6 text-center" role="status">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpenText size={27} aria-hidden="true" /></span>
          <h2 className="mt-5 text-xl font-semibold text-foreground">Today’s Digest is still being prepared.</h2>
          <p className="mt-2 text-base leading-7 text-muted-foreground">Please check back later.</p>
        </section>
      ) : (
        <div className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
          <PrepareYourLens preKnowledge={model.preKnowledge} wordBefore={model.wordBefore} />
          <CaseFile sections={model.articles} />
          <BuildYourDebate sections={model.build} />
          <CoachCorner sections={model.coach} />
          <RebuttalDrills sections={model.rebuttals} />
          <WeighingLanguage sections={model.weighing} />
          <VocabularySession sections={model.vocabulary} />
          <AdditionalBriefNotes sections={[...model.economics, ...model.additional]} />
          <BeforeYouSpeak sections={model.reminders} />
        </div>
      )}
    </main>
  );
}
