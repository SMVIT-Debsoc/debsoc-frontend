"use client";

import type { ReactNode } from "react";
import { ShieldCheck, Settings2, Sparkles } from "lucide-react";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { requestAssistantSettingsOpen } from "./AssistantSettingsEvents";
import { Pill, SectionHeader } from "./ui";
import { DEBASS_KEY_PRIVACY_COPY } from "@/lib/debass/privacy";

export function DebassWorkspaceHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { healthState, keyState } = useDebassWorkspace();
  const label = keyState === "validating" ? "Validating" : keyState === "invalid" ? "Invalid API key" : keyState !== "valid" ? "API key required" : healthState;
  const tone = keyState === "validating" || keyState !== "valid" ? "amber" : healthState === "Connected" ? "emerald" : healthState === "Unavailable" ? "slate" : "red";

  return (
    <SectionHeader
      title={title}
      subtitle={subtitle}
      right={
        <span className="inline-flex items-center gap-1.5" aria-live="polite">
          <span className={`h-1.5 w-1.5 rounded-full ${tone === "emerald" ? "bg-chart-3" : tone === "amber" ? "bg-chart-4" : tone === "slate" ? "bg-muted-foreground" : "bg-destructive"}`} aria-hidden="true" />
          <Pill tone={tone}>{label}</Pill>
        </span>
      }
    />
  );
}

export function OpenAssistantSettingsButton({ label = "Open AI Connection Center" }: { label?: string }) {
  return <button type="button" onClick={requestAssistantSettingsOpen} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary transition duration-200 hover:-translate-y-0.5 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"><Settings2 size={14} aria-hidden="true" />{label}</button>;
}

export function AssistantSettingsPrompt() {
  const { keyState } = useDebassWorkspace();
  if (keyState === "valid") return null;
  return <section className="rounded-[24px] border border-primary/20 bg-card/80 p-4 shadow-sm" aria-labelledby="connect-debsoc-ai-title"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles size={18} aria-hidden="true" /></span><div className="min-w-0"><h2 id="connect-debsoc-ai-title" className="text-sm font-semibold text-foreground">Connect DebSoc AI</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">This feature requires an OpenRouter API key. {DEBASS_KEY_PRIVACY_COPY}</p><p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck size={13} className="text-chart-3" aria-hidden="true" /> Connection is opt-in and explicit.</p></div></div><OpenAssistantSettingsButton label="Connect AI" /></div></section>;
}

export function LocalMarkdown({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let codeLines: string[] = [];
  let codeLanguage = "";
  let inCodeBlock = false;

  const flushCodeBlock = (key: string) => {
    blocks.push(
      <pre key={key} className="max-w-full overflow-x-auto rounded-xl border border-border bg-muted p-4 font-mono text-xs leading-5 text-foreground">
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
          ? <h3 key={key} className="pt-2 text-lg font-semibold tracking-tight text-foreground">{formatInline(heading)}</h3>
        : <h4 key={key} className="pt-1 text-base font-semibold text-foreground">{formatInline(heading)}</h4>);
    } else if (/^>\s?/.test(line)) {
      blocks.push(<blockquote key={key} className="border-l-2 border-primary pl-3 text-muted-foreground">{formatInline(line.replace(/^>\s?/, ""))}</blockquote>);
    } else if (/^[-*]\s+/.test(line)) {
      blocks.push(<div key={key} className="flex gap-2 pl-1"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" /><span>{formatInline(line.replace(/^[-*]\s+/, ""))}</span></div>);
    } else if (/^\d+\.\s+/.test(line)) {
      blocks.push(<div key={key} className="flex gap-2 pl-1"><span className="shrink-0 font-semibold text-primary">{line.match(/^\d+/)?.[0]}.</span><span>{formatInline(line.replace(/^\d+\.\s+/, ""))}</span></div>);
    } else {
      blocks.push(<p key={key}>{formatInline(line)}</p>);
    }
  });

  if (inCodeBlock || codeLines.length > 0) flushCodeBlock(`markdown-code-${lines.length}`);

  return <div className="font-serif max-w-full space-y-3 break-words text-sm leading-7 text-foreground">{blocks}</div>;
}

function formatInline(value: string) {
  const tokenPattern = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s)]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  return value.split(tokenPattern).map((part, index) => {
    const markdownLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (markdownLink) {
      return <a key={`${part}-${index}`} href={markdownLink[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/80">{markdownLink[1]}</a>;
    }
    if (/^https?:\/\//.test(part)) {
      return <a key={`${part}-${index}`} href={part} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/80">{part}</a>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}
