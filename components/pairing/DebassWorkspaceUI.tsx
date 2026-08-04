"use client";

import type { ReactNode } from "react";
import { FileText, Settings2 } from "lucide-react";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { requestAssistantSettingsOpen } from "./AssistantSettingsEvents";
import { Card, Pill, SectionHeader } from "./ui";

export function DebassWorkspaceHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { developmentMockEnabled, healthState, keyState } = useDebassWorkspace();
  const label = developmentMockEnabled ? "Local development preview" : keyState !== "valid" && healthState === "Connected" ? "Key required" : healthState;
  const tone = developmentMockEnabled || healthState === "Connecting" || label === "Key required" ? "amber" : healthState === "Connected" ? "emerald" : healthState === "Unavailable" ? "slate" : "red";

  return (
    <SectionHeader
      title={title}
      subtitle={subtitle}
      right={
        <span className="inline-flex items-center gap-1.5" aria-live="polite">
          <span className={`h-1.5 w-1.5 rounded-full ${tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-red-500"}`} aria-hidden="true" />
          <Pill tone={tone}>{label}</Pill>
        </span>
      }
    />
  );
}

export function OpenAssistantSettingsButton({ label = "Open Assistant Settings" }: { label?: string }) {
  return <button type="button" onClick={requestAssistantSettingsOpen} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-indigo-300/70 bg-indigo-50 px-3 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-200 dark:hover:bg-indigo-400/15"><Settings2 size={14} aria-hidden="true" />{label}</button>;
}

export function AssistantSettingsPrompt() {
  const { developmentMockEnabled, keyState } = useDebassWorkspace();
  if (developmentMockEnabled || keyState === "valid") return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50/70 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/[0.08] dark:text-amber-200"><span>Validate an OpenRouter key in Assistant Settings before sending a request.</span><OpenAssistantSettingsButton /></div>;
}

export function LocalWorkspaceHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <SectionHeader
      title={title}
      subtitle={subtitle}
      right={
        <span className="inline-flex items-center gap-1.5" aria-label="Local development preview. Not connected to Debass.">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          <Pill tone="amber">Local development preview</Pill>
        </span>
      }
    />
  );
}

export function LocalPreviewNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/[0.08] dark:text-amber-200">
      <span className="font-semibold">Not connected to Debass.</span> {children}
    </div>
  );
}

export function LocalMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
      {content.split("\n").map((line, index) => {
        const key = `${index}-${line}`;
        if (!line.trim()) return <div key={key} className="h-1" aria-hidden="true" />;
        if (line.startsWith("### ")) {
          return <h4 key={key} className="pt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{formatInline(line.slice(4))}</h4>;
        }
        if (line.startsWith("## ")) {
          return <h3 key={key} className="text-base font-semibold text-slate-950 dark:text-slate-100">{formatInline(line.slice(3))}</h3>;
        }
        if (line.startsWith("- ")) {
          return <div key={key} className="flex gap-2 pl-1"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" /><span>{formatInline(line.slice(2))}</span></div>;
        }
        return <p key={key}>{formatInline(line)}</p>;
      })}
    </div>
  );
}

export function LocalSources({ citations, local = true }: { citations: readonly string[]; local?: boolean }) {
  return (
    <Card className="mt-4 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
        <FileText size={14} aria-hidden="true" />
        {local ? "Local preview sources" : "Sources"}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {citations.map((citation) => (
          <div key={citation} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            {citation}
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatInline(value: string) {
  return value.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`} className="font-semibold text-slate-950 dark:text-slate-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}
