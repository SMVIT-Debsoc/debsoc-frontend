import {
  AlertCircle,
  BookOpenText,
  Brain,
  CalendarDays,
  ChevronDown,
  Lightbulb,
  Newspaper,
  Scale,
  Sparkles,
  Swords,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { normalizeDigestSections, type DigestSection } from "@/lib/digest/parse";

function clean(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function matchingSections(sections: unknown, title: string) {
  const safeSections = normalizeDigestSections(sections);
  return safeSections.filter((section) => section.title.toUpperCase() === title && clean(section.body));
}

function firstLine(value: unknown) {
  if (typeof value !== "string") return "";
  return value.split(/\r?\n/).map(clean).find(Boolean) ?? "";
}

function paragraphs(value: unknown) {
  if (typeof value !== "string") return [];
  return value.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function wordCount(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return 0;
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function readTime(value: string) {
  const count = wordCount(value);
  return count > 0 ? `${Math.max(1, Math.ceil(count / 200))} min read` : null;
}

function structuredItems(value: unknown) {
  if (typeof value !== "string") return [];
  const lines = value.split(/\r?\n/);
  const items: Array<{ label: string; body: string }> = [];
  let current: { label: string; body: string } | null = null;

  for (const line of lines) {
    const match = line.trim().match(/^(?:[-*•]\s*)?([^:]{2,54}):\s*(.*)$/);
    const label = clean(match?.[1]);
    const looksLikeLabel = Boolean(label) && (label === label.toUpperCase() || /^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,5}$/.test(label));
    if (match && looksLikeLabel) {
      current = { label, body: clean(match[2]) };
      items.push(current);
      continue;
    }
    if (current && line.trim()) current.body = `${current.body}${current.body ? "\n" : ""}${line.trim()}`;
  }

  return items.filter((item) => clean(item.body));
}

function BodyText({ value, editorial = false }: { value: unknown; editorial?: boolean }) {
  const blocks = paragraphs(value);
  return (
    <div className={`space-y-4 whitespace-pre-wrap break-words text-foreground/85 ${editorial ? "font-serif text-base leading-8 sm:text-lg" : "text-sm leading-7"}`}>
      {blocks.map((block, index) => <p key={`${block.slice(0, 24)}-${index}`}>{block}</p>)}
    </div>
  );
}

function EditorialSection({ title, icon: Icon, children, tone = "primary" }: { title: string; icon: LucideIcon; children: ReactNode; tone?: "primary" | "amber" | "yellow" }) {
  const toneClass = tone === "yellow" ? "border-chart-4/35 bg-chart-4/10" : tone === "amber" ? "border-chart-4/25 bg-chart-4/5" : "border-border bg-card/75";
  return (
    <section className={`rounded-[24px] border p-5 shadow-sm backdrop-blur-sm transition duration-200 hover:shadow-md motion-reduce:transition-none sm:p-7 ${toneClass}`}>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={18} aria-hidden="true" /></span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function VocabularyLines({ body }: { body: unknown }) {
  const text = typeof body === "string" ? body : "";
  const entries = text.split(/\r?\n/).map((line) => {
    const match = line.trim().match(/^(?:[-*•]\s*)?([^:—–-]{2,64})\s*[:—–-]\s*(.+)$/);
    return match ? { word: clean(match[1]), definition: clean(match[2]) } : null;
  }).filter((entry): entry is { word: string; definition: string } => Boolean(entry?.word && entry.definition));

  if (entries.length === 0) return <BodyText value={text} />;
  return <div className="grid gap-3 sm:grid-cols-2">{entries.map((entry) => <details key={entry.word} className="group rounded-2xl border border-border bg-background/55 open:bg-background/80"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><span>{entry.word}</span><ChevronDown size={16} className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></summary><p className="border-t border-border px-4 py-3 text-sm leading-6 text-muted-foreground">{entry.definition}</p></details>)}</div>;
}

function BuildCards({ body }: { body: unknown }) {
  const items = structuredItems(body);
  if (items.length === 0) return <BodyText value={body} />;
  return <div className="space-y-2">{items.map((item) => <details key={item.label} className="group rounded-2xl border border-border bg-background/45"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground outline-none transition hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><span>{item.label}</span><ChevronDown size={17} className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></summary><div className="border-t border-border px-4 py-4"><BodyText value={item.body} /></div></details>)}</div>;
}

function PracticeZone({ drills, weighing }: { drills: DigestSection[]; weighing: DigestSection[] }) {
  if (drills.length === 0 && weighing.length === 0) return null;
  const columns: Array<{ title: string; icon: LucideIcon; sections: DigestSection[] }> = [];
  if (drills.length > 0) columns.push({ title: "Rebuttal Drills", icon: Swords, sections: drills });
  if (weighing.length > 0) columns.push({ title: "Weighing Language", icon: Scale, sections: weighing });
  return <EditorialSection title="Practice Zone" icon={Target}><div className={`grid gap-4 ${columns.length > 1 ? "lg:grid-cols-2" : "grid-cols-1"}`}>{columns.map((column) => { const Icon = column.icon; return <div key={column.title} className="rounded-2xl border border-border bg-background/45 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon size={16} className="text-primary" aria-hidden="true" />{column.title}</div><div className="mt-3 space-y-4">{column.sections.map((section) => <BodyText key={section.title} value={section.body} />)}</div></div>; })}</div></EditorialSection>;
}

export default function DigestCards({ sections, updatedAt }: { sections: DigestSection[]; updatedAt: Date }) {
  const visibleSections = normalizeDigestSections(sections).filter((section) => clean(section.body));
  const topicSection = matchingSections(visibleSections, "TOPIC FOR TODAY")[0];
  const topic = firstLine(topicSection?.body);
  const preKnowledge = matchingSections(visibleSections, "PRE-KNOWLEDGE");
  const wordsBefore = matchingSections(visibleSections, "WORD BEFORE YOU READ");
  const articles = matchingSections(visibleSections, "TODAY'S ARTICLE / CASE");
  const build = matchingSections(visibleSections, "YOUR DEBATING BUILD");
  const drills = matchingSections(visibleSections, "REBUTTAL DRILLS");
  const weighing = matchingSections(visibleSections, "WEIGHING LANGUAGE TO USE");
  const vocabulary = matchingSections(visibleSections, "VOCAB SESSION");
  const reminders = matchingSections(visibleSections, "THINGS TO TAKE CARE");
  const economics = visibleSections.filter((section) => /ECONOM|FINANCE|MARKET|GDP|TAXATION|TRADE/i.test(section.title));
  const known = new Set(["TOPIC FOR TODAY", "PRE-KNOWLEDGE", "WORD BEFORE YOU READ", "TODAY'S ARTICLE / CASE", "YOUR DEBATING BUILD", "REBUTTAL DRILLS", "WEIGHING LANGUAGE TO USE", "VOCAB SESSION", "THINGS TO TAKE CARE"]);
  const additional = visibleSections.filter((section) => !known.has(section.title.toUpperCase()) && !economics.includes(section));
  const date = updatedAt instanceof Date && !Number.isNaN(updatedAt.getTime())
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" }).format(updatedAt)
    : null;
  const articleText = articles.map((section) => section.body).join("\n\n");
  const hasLearningContent = preKnowledge.length > 0 || wordsBefore.length > 0 || articles.length > 0 || build.length > 0 || drills.length > 0 || weighing.length > 0 || vocabulary.length > 0 || reminders.length > 0 || economics.length > 0 || additional.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <header className="border-b border-border pb-8 sm:pb-10">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles size={14} aria-hidden="true" /> Daily learning workspace</div>
        <h1 className="mt-5 max-w-4xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{topic ? <>Today&rsquo;s Debate Topic<span className="mt-2 block font-serif font-normal text-primary">{topic}</span></> : "Today’s Debate Digest"}</h1>
        {date && <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays size={15} aria-hidden="true" />{date}</p>}
      </header>

      {!hasLearningContent ? <section className="mx-auto flex min-h-[42vh] max-w-md flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpenText size={27} aria-hidden="true" /></span><h2 className="mt-5 text-xl font-semibold text-foreground">Today&rsquo;s Digest is still being prepared.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Please check back later.</p></section> : <div className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
        {(preKnowledge.length > 0 || wordsBefore.length > 0) && <EditorialSection title="Background Knowledge" icon={Brain} tone="amber"><div className="space-y-6">{preKnowledge.map((section) => <BodyText key={section.title} value={section.body} editorial />)}{wordsBefore.map((section) => <div key={section.title}><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Words before you know</p><VocabularyLines body={section.body} /></div>)}</div></EditorialSection>}
        {articles.length > 0 && <EditorialSection title="Today’s Article" icon={Newspaper}><div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary"><BookOpenText size={13} aria-hidden="true" /> Editorial reading</span>{readTime(articleText) && <span>{readTime(articleText)}</span>}</div><div className="mt-6 space-y-5">{articles.map((section) => <BodyText key={section.title} value={section.body} editorial />)}</div></EditorialSection>}
        {build.length > 0 && <EditorialSection title="Build Your Debate" icon={Target}>{build.map((section) => <BuildCards key={section.title} body={section.body} />)}</EditorialSection>}
        {economics.length > 0 && <EditorialSection title="Economics & Finance Insight" icon={Scale}>{economics.map((section) => <div key={section.title}><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{section.title}</p><BodyText value={section.body} /></div>)}</EditorialSection>}
        <PracticeZone drills={drills} weighing={weighing} />
        {vocabulary.length > 0 && <EditorialSection title="Vocabulary" icon={BookOpenText}>{vocabulary.map((section) => <VocabularyLines key={section.title} body={section.body} />)}</EditorialSection>}
        {reminders.length > 0 && <EditorialSection title="Remember" icon={Lightbulb} tone="yellow"><div className="grid gap-3 sm:grid-cols-2">{reminders.flatMap((section) => paragraphs(section.body)).map((reminder, index) => <div key={`${reminder.slice(0, 20)}-${index}`} className="rounded-2xl border border-chart-4/35 bg-background/45 p-4 font-serif text-base leading-7 text-foreground"><span className="mb-2 block font-sans text-xs font-semibold uppercase tracking-[0.15em] text-chart-4">Remember</span>{reminder}</div>)}</div></EditorialSection>}
        {additional.length > 0 && <EditorialSection title="Additional Reading" icon={AlertCircle}>{additional.map((section) => <div key={section.title}><h3 className="text-sm font-semibold text-foreground">{section.title}</h3><div className="mt-3"><BodyText value={section.body} /></div></div>)}</EditorialSection>}
      </div>}
    </main>
  );
}
