"use client";

import {
  BookOpenText,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Gavel,
  Lightbulb,
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

function readTime(value: unknown): string | null {
  const count = wordCount(value);
  return count > 0 ? `${Math.max(1, Math.ceil(count / 200))} min read` : null;
}

type StructuredItem = { label: string; body: string };

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
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function BodyText({ value, editorial = false }: { value: unknown; editorial?: boolean }) {
  const blocks = paragraphs(value);
  if (blocks.length === 0) return null;

  return (
    <div className={`space-y-4 break-words text-foreground/85 ${editorial ? "font-serif text-base leading-8 sm:text-lg" : "text-base leading-7"}`}>
      {blocks.map((block, index) => (
        <p key={`${block.slice(0, 28)}-${index}`}>{block}</p>
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
  const toneClass = tone === "amber"
    ? "border-chart-4/35 bg-chart-4/10"
    : tone === "warm"
      ? "border-chart-4/25 bg-chart-4/5"
      : "border-border bg-card/80";

  return (
    <section className={`rounded-[24px] border p-5 shadow-sm backdrop-blur-sm sm:p-7 ${toneClass}`}>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={19} aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
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
        className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="break-words">{label}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={contentId} className="border-t border-border px-4 py-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

function WordBeforeYouRead({ sections }: { sections: DigestSection[] }) {
  const entries = sections.flatMap((section) => {
    const parsed = lines(section.body).map((line) => {
      const match = line.match(/^(?:[-*•]\s*)?([^:—–-]{2,64})\s*[:—–-]\s*(.+)$/);
      return match ? { word: clean(match[1]), meaning: clean(match[2]) } : null;
    });
    return parsed.filter((entry): entry is { word: string; meaning: string } => Boolean(entry?.word && entry.meaning));
  });

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Word before you read</p>
      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <Disclosure key={`${entry.word}-${index}`} label={entry.word}>
              <p className="font-serif text-base leading-7 text-foreground/85">{entry.meaning}</p>
            </Disclosure>
          ))}
        </div>
      ) : (
        <BodyText value={sections.map((section) => section.body).join("\n\n")} editorial />
      )}
    </div>
  );
}

function PrepareYourLens({ preKnowledge, wordBefore }: { preKnowledge: DigestSection[]; wordBefore: DigestSection[] }) {
  if (preKnowledge.length === 0 && wordBefore.length === 0) return null;
  const split = preKnowledge.length > 0 && wordBefore.length > 0;

  return (
    <BriefSection title="Prepare Your Lens" icon={Brain} tone="warm">
      <div className={`grid gap-6 ${split ? "lg:grid-cols-[1.15fr_0.85fr]" : "grid-cols-1"}`}>
        {preKnowledge.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Background knowledge</p>
            {preKnowledge.map((section, index) => <BodyText key={`${section.title}-${index}`} value={section.body} editorial />)}
          </div>
        )}
        {wordBefore.length > 0 && <WordBeforeYouRead sections={wordBefore} />}
      </div>
    </BriefSection>
  );
}

function CaseFile({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  const articleText = sections.map((section) => section.body).join("\n\n");
  const evidence = sections.flatMap((section) => structuredItems(section.body))
    .filter((item) => /evidence|detail|background|context/i.test(item.label));

  return (
    <BriefSection title="Today’s Case File" icon={Newspaper}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
          <FileText size={14} aria-hidden="true" /> Editorial reading
        </span>
        {readTime(articleText) && <span>{readTime(articleText)}</span>}
      </div>
      <div className={`mt-6 grid gap-6 ${evidence.length > 0 ? "lg:grid-cols-[1fr_0.32fr]" : "grid-cols-1"}`}>
        <div className="space-y-5">
          {sections.map((section, index) => <BodyText key={`${section.title}-${index}`} value={section.body} editorial />)}
        </div>
        {evidence.length > 0 && (
          <aside className="h-fit rounded-2xl border border-border bg-background/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Evidence to use</p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-foreground/80">
              {evidence.map((item, index) => <p key={`${item.label}-${index}`}>{item.body}</p>)}
            </div>
          </aside>
        )}
      </div>
    </BriefSection>
  );
}

function BuildWorkspace({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  const items = sections.flatMap((section) => structuredItems(section.body));
  if (items.length === 0) {
    return <BriefSection title="Build Your Debate" icon={Target}><BodyText value={sections.map((section) => section.body).join("\n\n")} editorial /></BriefSection>;
  }

  const proposition = items.filter((item) => /proposition|government|supporting|for the motion/i.test(item.label));
  const opposition = items.filter((item) => /opposition|challenging|against the motion/i.test(item.label));
  const strategyItems = items.filter((item) => /coach|framing|clash|judge|burden/i.test(item.label));
  const grouped = proposition.length > 0 || opposition.length > 0;
  const remaining = items.filter((item) => !proposition.includes(item) && !opposition.includes(item) && !strategyItems.includes(item));

  if (!grouped && remaining.length === 0) return null;

  return (
    <BriefSection title="Build Your Debate" icon={Target}>
      <div className="space-y-6">
        {grouped && (
          <div className="grid gap-4 lg:grid-cols-2">
            {proposition.length > 0 && <ArgumentColumn title="Proposition" icon={Target} items={proposition} />}
            {opposition.length > 0 && <ArgumentColumn title="Opposition" icon={Scale} items={opposition} />}
          </div>
        )}
        {remaining.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">How to win this round</p>
            {remaining.map((item, index) => <Disclosure key={`${item.label}-${index}`} label={displayLabel(item.label)}><BodyText value={item.body} editorial /></Disclosure>)}
          </div>
        )}
      </div>
    </BriefSection>
  );
}

function ArgumentColumn({ title, icon: Icon, items }: { title: string; icon: LucideIcon; items: StructuredItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-background/45 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon size={17} className="text-primary" aria-hidden="true" />{title}</div>
      <div className="mt-3 space-y-3">
        {items.map((item, index) => <Disclosure key={`${item.label}-${index}`} label={displayLabel(item.label)}><BodyText value={item.body} editorial /></Disclosure>)}
      </div>
    </div>
  );
}

function CoachCorner({ sections, build }: { sections: DigestSection[]; build: DigestSection[] }) {
  const strategyItems = build.flatMap((section) => structuredItems(section.body)).filter((item) => /coach|framing|clash|judge|burden/i.test(item.label));
  if (sections.length === 0 && strategyItems.length === 0) return null;

  return (
    <BriefSection title="Coach’s Corner" icon={Lightbulb} tone="warm">
      <div className="space-y-3">
        {sections.map((section, index) => <Disclosure key={`${section.title}-${index}`} label={displayLabel(section.title)} defaultOpen><BodyText value={section.body} editorial /></Disclosure>)}
        {strategyItems.map((item, index) => <Disclosure key={`${item.label}-${index}`} label={displayLabel(item.label)}><BodyText value={item.body} editorial /></Disclosure>)}
      </div>
    </BriefSection>
  );
}

function PracticeBeforeRound({ rebuttals, weighing }: { rebuttals: DigestSection[]; weighing: DigestSection[] }) {
  if (rebuttals.length === 0 && weighing.length === 0) return null;
  const columns = rebuttals.length > 0 && weighing.length > 0;

  return (
    <BriefSection title="Practice Before the Round" icon={Swords}>
      <div className={`grid gap-6 ${columns ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {rebuttals.length > 0 && <PracticeColumn title="Rebuttal Drills" icon={Swords} sections={rebuttals} />}
        {weighing.length > 0 && <WeighingColumn sections={weighing} />}
      </div>
    </BriefSection>
  );
}

function PracticeColumn({ title, icon: Icon, sections }: { title: string; icon: LucideIcon; sections: DigestSection[] }) {
  const items = sections.flatMap((section) => structuredItems(section.body));
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon size={17} className="text-primary" aria-hidden="true" />{title}</div>
      <div className="mt-3 space-y-3">
        {items.length > 0 ? items.map((item, index) => <Disclosure key={`${item.label}-${index}`} label={displayLabel(item.label)}><BodyText value={item.body} editorial /></Disclosure>) : sections.map((section, index) => <Disclosure key={`${section.title}-${index}`} label="Rebuttal drill"><BodyText value={section.body} editorial /></Disclosure>)}
      </div>
    </div>
  );
}

function WeighingColumn({ sections }: { sections: DigestSection[] }) {
  const items = sections.flatMap((section) => structuredItems(section.body));
  const phrases = items.length > 0 ? items.map((item) => `${item.label}: ${item.body}`) : sections.flatMap((section) => lines(section.body));
  if (phrases.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Scale size={17} className="text-primary" aria-hidden="true" />Weighing Language</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {phrases.map((phrase, index) => <span key={`${phrase.slice(0, 32)}-${index}`} className="rounded-xl border border-border bg-background/55 px-3 py-2 font-serif text-sm leading-6 text-foreground/85">{phrase}</span>)}
      </div>
    </div>
  );
}

function VocabularySession({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  const entries = sections.flatMap((section) => lines(section.body).map((line) => {
    const match = line.match(/^(?:[-*•]\s*)?([^:—–-]{2,64})\s*[:—–-]\s*(.+)$/);
    return match ? { word: clean(match[1]), meaning: clean(match[2]) } : null;
  })).filter((entry): entry is { word: string; meaning: string } => Boolean(entry?.word && entry.meaning));

  return (
    <BriefSection title="Vocabulary Session" icon={BookOpenText}>
      {entries.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">{entries.map((entry, index) => <div key={`${entry.word}-${index}`} className="rounded-2xl border border-border bg-background/45 p-4"><p className="font-serif text-lg font-semibold text-foreground">{entry.word}</p><p className="mt-2 text-sm leading-6 text-foreground/80">{entry.meaning}</p></div>)}</div> : <BodyText value={sections.map((section) => section.body).join("\n\n")} editorial />}
    </BriefSection>
  );
}

function BeforeYouSpeak({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  const reminders = sections.flatMap((section) => lines(section.body));
  if (reminders.length === 0) return null;

  return (
    <BriefSection title="Before You Speak" icon={ClipboardList} tone="amber">
      <div className="grid gap-3 sm:grid-cols-2">
        {reminders.map((reminder, index) => <div key={`${reminder.slice(0, 28)}-${index}`} className="rounded-2xl border border-chart-4/35 bg-background/45 p-4 font-serif text-base leading-7 text-foreground"><CheckCircle2 size={17} className="mb-2 text-chart-4" aria-hidden="true" />{reminder}</div>)}
      </div>
    </BriefSection>
  );
}

function SupportingNotes({ sections }: { sections: DigestSection[] }) {
  if (sections.length === 0) return null;
  return (
    <BriefSection title="Further Notes" icon={Gavel}>
      <div className="space-y-6">
        {sections.map((section, index) => <div key={`${section.title}-${index}`}><h3 className="text-sm font-semibold text-foreground">{section.title}</h3><div className="mt-3"><BodyText value={section.body} /></div></div>)}
      </div>
    </BriefSection>
  );
}

export default function DigestCards({ sections, updatedAt, refreshing = false }: { sections: DigestSection[]; updatedAt: Date; refreshing?: boolean }) {
  const model = buildDigestBriefModel(sections);
  const date = updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" }).format(updatedAt)
    : null;
  const hasContent = model.sections.length > 0;

  return (
    <main className="mx-auto w-full max-w-[1040px] px-4 pb-16 sm:px-6 lg:px-8">
      <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border py-3 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles size={14} aria-hidden="true" />Daily Debate Brief</span>
        <div className="flex items-center gap-3 text-right">
          {date && <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" />{date}</span>}
          {refreshing && <span role="status">Refreshing…</span>}
        </div>
      </div>

      <header className="border-b border-border py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Your daily preparation brief</p>
        <h1 className="mt-4 max-w-4xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {model.topic ? <>Today’s Debate Topic<span className="mt-3 block font-serif font-normal leading-tight text-primary">{model.topic}</span></> : "Today’s Debate Digest"}
        </h1>
        {model.motion && <div className="mt-8 max-w-3xl rounded-2xl border border-primary/25 bg-primary/5 p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Motion we are debating</p><p className="mt-3 font-serif text-lg leading-8 text-foreground sm:text-xl">{model.motion}</p></div>}
      </header>

      {!hasContent ? (
        <section className="mx-auto flex min-h-[42vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpenText size={27} aria-hidden="true" /></span>
          <h2 className="mt-5 text-xl font-semibold text-foreground">Today’s Digest is still being prepared.</h2>
          <p className="mt-2 text-base leading-7 text-muted-foreground">Please check back later.</p>
        </section>
      ) : (
        <div className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
          <PrepareYourLens preKnowledge={model.preKnowledge} wordBefore={model.wordBefore} />
          <CaseFile sections={model.articles} />
          <BuildWorkspace sections={model.build} />
          <CoachCorner sections={model.coach} build={model.build} />
          <PracticeBeforeRound rebuttals={model.rebuttals} weighing={model.weighing} />
          <VocabularySession sections={model.vocabulary} />
          <BeforeYouSpeak sections={model.reminders} />
          <SupportingNotes sections={[...model.economics, ...model.additional]} />
        </div>
      )}
    </main>
  );
}
