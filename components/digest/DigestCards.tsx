import {
  BookOpen,
  Brain,
  Newspaper,
  Hammer,
  Swords,
  Scale,
  MessageSquareQuote,
  BookMarked,
  AlertTriangle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { DigestSection } from "@/lib/digest/parse";

/** Per-section accent + icon. Keys are the canonical known titles (upper-case). */
const SECTION_STYLE: Record<
  string,
  { accent: string; ring: string; icon: LucideIcon }
> = {
  "TOPIC FOR TODAY": {
    accent: "text-rose-600 dark:text-rose-400",
    ring: "border-l-rose-500",
    icon: Sparkles,
  },
  "PRE-KNOWLEDGE": {
    accent: "text-amber-600 dark:text-amber-400",
    ring: "border-l-amber-500",
    icon: Brain,
  },
  "WORD BEFORE YOU READ": {
    accent: "text-lime-600 dark:text-lime-400",
    ring: "border-l-lime-500",
    icon: BookOpen,
  },
  "TODAY'S ARTICLE / CASE": {
    accent: "text-emerald-600 dark:text-emerald-400",
    ring: "border-l-emerald-500",
    icon: Newspaper,
  },
  "YOUR DEBATING BUILD": {
    accent: "text-teal-600 dark:text-teal-400",
    ring: "border-l-teal-500",
    icon: Hammer,
  },
  "REBUTTAL DRILLS": {
    accent: "text-sky-600 dark:text-sky-400",
    ring: "border-l-sky-500",
    icon: Swords,
  },
  "WEIGHING LANGUAGE TO USE": {
    accent: "text-indigo-600 dark:text-indigo-400",
    ring: "border-l-indigo-500",
    icon: Scale,
  },
  "VOCAB SESSION": {
    accent: "text-violet-600 dark:text-violet-400",
    ring: "border-l-violet-500",
    icon: BookMarked,
  },
  "THINGS TO TAKE CARE": {
    accent: "text-orange-600 dark:text-orange-400",
    ring: "border-l-orange-500",
    icon: AlertTriangle,
  },
};

const GENERIC_STYLE = {
  accent: "text-slate-600 dark:text-slate-300",
  ring: "border-l-slate-400 dark:border-l-slate-600",
  icon: MessageSquareQuote,
};

function styleFor(section: DigestSection) {
  if (section.known) {
    return SECTION_STYLE[section.title.toUpperCase()] ?? GENERIC_STYLE;
  }
  return GENERIC_STYLE;
}

export default function DigestCards({
  sections,
  updatedAt,
}: {
  sections: DigestSection[];
  updatedAt: Date;
}) {
  const formatted = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(updatedAt);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>Debate Digest</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
          Today&rsquo;s Digest
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Updated {formatted}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {sections.map((section, i) => {
          const style = styleFor(section);
          const Icon = style.icon;
          return (
            <article
              key={`${section.title}-${i}`}
              className={`group rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 ${style.ring}`}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 ${style.accent}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <h2
                  className={`text-sm font-semibold uppercase tracking-wide ${style.accent}`}
                >
                  {section.title}
                </h2>
              </div>
              <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                {section.body || "—"}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
