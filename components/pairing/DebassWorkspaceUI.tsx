"use client";

import type { ReactNode } from "react";
import { Settings2 } from "lucide-react";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { requestAssistantSettingsOpen } from "./AssistantSettingsEvents";
import { Pill, SectionHeader } from "./ui";

export function DebassWorkspaceHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { healthState, keyState } = useDebassWorkspace();
  const label = keyState !== "valid" && healthState === "Connected" ? "Key required" : healthState;
  const tone = healthState === "Connecting" || label === "Key required" ? "amber" : healthState === "Connected" ? "emerald" : healthState === "Unavailable" ? "slate" : "red";

  return (
    <SectionHeader
      title={title}
      subtitle={subtitle}
      right={
        <span className="inline-flex items-center gap-1.5" aria-live="polite">
          <span className={`h-1.5 w-1.5 rounded-full ${tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : tone === "slate" ? "bg-slate-400" : "bg-red-500"}`} aria-hidden="true" />
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
  const { keyState } = useDebassWorkspace();
  if (keyState === "valid") return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50/70 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/[0.08] dark:text-amber-200"><span>Validate an OpenRouter key in Assistant Settings before sending a request.</span><OpenAssistantSettingsButton /></div>;
}

export function LocalMarkdown({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inCodeBlock = false;

  const flushCodeBlock = (key: string) => {
    blocks.push(
      <pre key={key} className="max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100 dark:border-white/10">
        <code data-language={codeLanguage || undefined}>{codeLines.join("\n")}</code>
      </pre>,
    );
    codeLines = [];
    codeLanguage = "";
  };

  lines.forEach((line, index) => {
    const key = `markdown-${index}`;
    if (line.startsWith("```")) {
      if (inCodeBlock) flushCodeBlock(key);
      else codeLanguage = line.slice(3).trim();
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }
    if (!line.trim()) {
      blocks.push(<div key={key} className="h-1" aria-hidden="true" />);
    } else if (/^#{1,3} /.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const heading = line.replace(/^#{1,3}\s+/, "");
      blocks.push(level === 1
        ? <h3 key={key} className="pt-2 text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">{formatInline(heading)}</h3>
        : <h4 key={key} className="pt-1 text-base font-semibold text-slate-950 dark:text-slate-100">{formatInline(heading)}</h4>);
    } else if (/^>\s?/.test(line)) {
      blocks.push(<blockquote key={key} className="border-l-2 border-indigo-400 pl-3 text-slate-600 dark:border-indigo-300 dark:text-slate-400">{formatInline(line.replace(/^>\s?/, ""))}</blockquote>);
    } else if (/^[-*]\s+/.test(line)) {
      blocks.push(<div key={key} className="flex gap-2 pl-1"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden="true" /><span>{formatInline(line.replace(/^[-*]\s+/, ""))}</span></div>);
    } else if (/^\d+\.\s+/.test(line)) {
      blocks.push(<div key={key} className="flex gap-2 pl-1"><span className="shrink-0 font-semibold text-indigo-600 dark:text-indigo-300">{line.match(/^\d+/)?.[0]}.</span><span>{formatInline(line.replace(/^\d+\.\s+/, ""))}</span></div>);
    } else {
      blocks.push(<p key={key}>{formatInline(line)}</p>);
    }
  });

  if (inCodeBlock || codeLines.length > 0) flushCodeBlock(`markdown-code-${lines.length}`);

  return <div className="max-w-full space-y-3 break-words text-sm leading-7 text-slate-700 dark:text-slate-300">{blocks}</div>;
}

function formatInline(value: string) {
  const tokenPattern = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s)]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  return value.split(tokenPattern).map((part, index) => {
    const markdownLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (markdownLink) {
      return <a key={`${part}-${index}`} href={markdownLink[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 dark:text-indigo-300 dark:decoration-indigo-500/60 dark:hover:text-indigo-200">{markdownLink[1]}</a>;
    }
    if (/^https?:\/\//.test(part)) {
      return <a key={`${part}-${index}`} href={part} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 dark:text-indigo-300 dark:decoration-indigo-500/60 dark:hover:text-indigo-200">{part}</a>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-900 dark:bg-white/10 dark:text-slate-100">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`} className="font-semibold text-slate-950 dark:text-slate-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}
