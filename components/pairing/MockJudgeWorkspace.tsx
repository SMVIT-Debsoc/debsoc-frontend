"use client";

import { useEffect, useRef, useState } from "react";
import { Gavel, Loader2, RotateCcw, Sparkles } from "lucide-react";
import SearchableDropdown from "@/components/smoothui/components/searchable-dropdown";
import { getLocalJudgeFixture, LOCAL_JUDGE_FORMATS } from "@/lib/dev/debass-mock/fixtures";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { Card, EmptyState, Field, Pill, PrimaryButton, SecondaryButton } from "./ui";
import { LocalMarkdown, LocalPreviewNotice, LocalWorkspaceHeader } from "./DebassWorkspaceUI";
import RealMockJudgeWorkspace from "./RealMockJudgeWorkspace";

export default function MockJudgeWorkspace({ developmentDebassMockEnabled = false, embedded = false }: { developmentDebassMockEnabled?: boolean; embedded?: boolean }) {
  if (!developmentDebassMockEnabled) {
    return <RealMockJudgeWorkspace embedded={embedded} />;
  }

  return <LocalMockJudgeWorkspace embedded={embedded} />;
}

function LocalMockJudgeWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { assistantSessionVersion } = useDebassWorkspace();
  const [motion, setMotion] = useState("");
  const [format, setFormat] = useState(LOCAL_JUDGE_FORMATS[0]?.id ?? "bp");
  const [speakerInfo, setSpeakerInfo] = useState("");
  const [argument, setArgument] = useState("");
  const [result, setResult] = useState<ReturnType<typeof getLocalJudgeFixture> | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedFormat = LOCAL_JUDGE_FORMATS.find((item) => item.id === format)?.label ?? "British Parliamentary";

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMotion("");
      setSpeakerInfo("");
      setArgument("");
      setResult(null);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [assistantSessionVersion]);

  const judge = () => {
    if (!argument.trim() || loading) return;
    setLoading(true);
    setResult(null);
    timerRef.current = setTimeout(() => {
      setResult(getLocalJudgeFixture({ motion, format: selectedFormat, speakerInfo, argument }));
      setLoading(false);
    }, 800);
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMotion("");
    setFormat(LOCAL_JUDGE_FORMATS[0]?.id ?? "bp");
    setSpeakerInfo("");
    setArgument("");
    setResult(null);
    setLoading(false);
  };

  return (
    <div className={`w-full min-w-0 space-y-5 ${embedded ? "min-h-[620px]" : "mx-auto max-w-6xl"}`}>
      {!embedded && <LocalWorkspaceHeader title="Mock Judge" subtitle="Review a speech with a structured judging-style feedback surface." />}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.7fr)]">
        <Card className="min-h-[560px] p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Gavel size={18} className="text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Prepare an argument</h2></div><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add context and the argument you want to review.</p></div><Pill tone="amber">Local preview</Pill></div>
          <div className="mt-5 space-y-4">
            <Field label="Motion or debate context"><input value={motion} onChange={(event) => { setMotion(event.target.value); setResult(null); }} placeholder="This House would..." className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400" /></Field>
            <Field label="Format (local preview context)"><SearchableDropdown searchable={false} items={LOCAL_JUDGE_FORMATS} emptyMessage="No formats found" label="Debate format" placeholder="Select format" value={format} onSelect={(item) => { setFormat(item.id); setResult(null); }} /></Field>
            <Field label="Speaker or team information" hint="Optional context for the deterministic preview."><input value={speakerInfo} onChange={(event) => { setSpeakerInfo(event.target.value); setResult(null); }} placeholder="Speaker, team, side, or round notes" className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400" /></Field>
            <Field label="Speech or argument"><textarea value={argument} onChange={(event) => { setArgument(event.target.value); setResult(null); }} rows={13} placeholder="Paste or write the speech you want to review..." className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400" /></Field>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10"><SecondaryButton type="button" onClick={reset} disabled={!motion && !speakerInfo && !argument && !result && !loading}><RotateCcw size={15} aria-hidden="true" /> Reset</SecondaryButton><PrimaryButton type="button" onClick={judge} disabled={!argument.trim() || loading}>{loading ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Judging locally...</> : <><Sparkles size={15} aria-hidden="true" /> Review speech</>}</PrimaryButton></div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Judge Feedback</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A clear result surface for local interaction testing.</p></div>{result && <Pill tone="amber">Local preview result</Pill>}</div>
          <div className="mt-5">
            {loading ? <div className="flex min-h-[390px] flex-col items-center justify-center text-center" aria-live="polite"><Loader2 size={28} className="animate-spin text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">Preparing development mock feedback...</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No service request is being made.</p></div> : result ? <div className="space-y-4"><div className="rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-400/[0.08]"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">Local preview score</span><span className="text-2xl font-semibold text-amber-900 dark:text-amber-200">{result.score}<span className="text-sm font-medium">/100</span></span></div><p className="mt-2 text-xs leading-5 text-amber-900/75 dark:text-amber-200/75">Sample display data only; not a production judge score.</p></div><div className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"><Gavel size={14} aria-hidden="true" /> Development mock response</div><LocalMarkdown content={result.reasoning} /></div><div className="grid gap-3 sm:grid-cols-2"><FeedbackList title="Strengths" items={result.strengths} tone="emerald" /><FeedbackList title="Improvement areas" items={result.weaknesses} tone="red" /></div><SecondaryButton type="button" onClick={judge} disabled={loading || !argument.trim()} className="w-full"><RotateCcw size={14} aria-hidden="true" /> Retry preview result</SecondaryButton></div> : <EmptyState title="Judge Feedback will appear here" body="Add a speech and choose Review speech to test the local judging flow." />}
          </div>
        </Card>
      </div>
      {!embedded && <LocalPreviewNotice>This is a deterministic Development mock response. It is not a RAG result, does not calculate a production score, and is not connected to Debass.</LocalPreviewNotice>}
    </div>
  );
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: "emerald" | "red" }) {
  return <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone === "emerald" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{title}</div><ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600 dark:text-slate-400">{items.map((item) => <li key={item} className="flex gap-2"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "emerald" ? "bg-emerald-500" : "bg-red-500"}`} aria-hidden="true" />{item}</li>)}</ul></div>;
}
