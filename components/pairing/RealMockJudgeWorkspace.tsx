"use client";

import { useEffect, useRef, useState } from "react";
import { Gavel, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { debassClient } from "@/lib/debass/client";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { Card, EmptyState, Field, PrimaryButton, SecondaryButton } from "./ui";
import { AssistantSettingsPrompt, DebassWorkspaceHeader, LocalMarkdown } from "./DebassWorkspaceUI";
import HowToUseCard from "./HowToUseCard";

type JudgeResult = { score: number; reasoning: string; strengths: string[]; weaknesses: string[] };

export default function RealMockJudgeWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { acceptedKey, keyState, model, assistantSessionVersion } = useDebassWorkspace();
  const [argument, setArgument] = useState("");
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => {
    requestController.current?.abort();
    const resetTimer = window.setTimeout(() => {
      setArgument("");
      setResult(null);
      setError(null);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [assistantSessionVersion]);

  useEffect(() => () => requestController.current?.abort(), []);

  const judge = async () => {
    if (!argument.trim() || loading || keyState !== "valid" || !acceptedKey) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const nextResult = await debassClient.judge(acceptedKey, argument.trim(), controller.signal, model);
      if (!controller.signal.aborted) setResult(nextResult);
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Judge analysis could not be completed.");
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  };

  const reset = () => {
    requestController.current?.abort();
    requestController.current = null;
    setArgument("");
    setResult(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className={`w-full min-w-0 space-y-5 ${embedded ? "min-h-[620px]" : "mx-auto max-w-6xl"}`}>
      {!embedded && <><DebassWorkspaceHeader title="Mock Judge" subtitle="Review a speech with the real Debass judging response and returned criteria." /><HowToUseCard kind="judge" /></>}
      <div className={`grid gap-5 ${embedded ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.7fr)]"}`}>
        <Card className="min-h-[560px] p-4 sm:p-6"><div className="flex items-start gap-2"><Gavel size={18} className="mt-0.5 text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><div><h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Prepare an argument</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The argument is sent to Debass with the documented empty rubric object.</p></div></div><div className="mt-5 space-y-4"><Field label="Speech or argument"><textarea value={argument} onChange={(event) => { setArgument(event.target.value); setResult(null); }} rows={embedded ? 18 : 16} placeholder="Paste or write the speech you want reviewed..." className="min-h-72 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400" /></Field><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10"><SecondaryButton type="button" onClick={reset} disabled={!argument && !result && !loading}><RotateCcw size={15} aria-hidden="true" /> Reset</SecondaryButton><PrimaryButton type="button" onClick={() => void judge()} disabled={!argument.trim() || keyState !== "valid" || loading}>{loading ? <><Loader2 size={15} className="motion-safe:animate-spin" aria-hidden="true" /> Reviewing…</> : <><Sparkles size={15} aria-hidden="true" /> Review argument</>}</PrimaryButton></div></div></Card>
        <Card className="min-h-[560px] p-4 sm:p-6"><div className="flex items-center gap-2"><Gavel size={16} className="text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><div><h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Judge Feedback</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Scores and feedback appear only when returned by Debass.</p></div></div><div className="mt-5" aria-busy={loading}>{loading ? <div className="flex min-h-[390px] flex-col items-center justify-center text-center" role="status" aria-live="polite"><Loader2 size={28} className="motion-safe:animate-spin text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">Judging…</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Debass is reviewing the argument.</p></div> : result ? <div className="space-y-4"><div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-400/20 dark:bg-indigo-400/[0.08]"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-800 dark:text-indigo-300">Returned score</span><span className="text-2xl font-semibold text-indigo-900 dark:text-indigo-200">{result.score}</span></div></div><section className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Reasoning</h3><div className="mt-3"><LocalMarkdown content={result.reasoning} /></div></section><div className="grid gap-3 sm:grid-cols-2"><FeedbackList title="Strengths" items={result.strengths} tone="emerald" /><FeedbackList title="Weaknesses" items={result.weaknesses} tone="red" /></div><SecondaryButton type="button" onClick={() => void judge()} disabled={loading || keyState !== "valid"} className="w-full"><RotateCcw size={14} aria-hidden="true" /> Retry review</SecondaryButton></div> : error ? <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-400/20 dark:bg-red-400/[0.08]" role="alert"><p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p><SecondaryButton type="button" onClick={() => void judge()} disabled={loading || keyState !== "valid"}><RotateCcw size={14} aria-hidden="true" /> Retry</SecondaryButton></div> : <EmptyState title="Judge Feedback will appear here" body="Add an argument, validate your key, then choose Review argument." />}</div></Card>
      </div>
      {!embedded && <AssistantSettingsPrompt />}
    </div>
  );
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: "emerald" | "red" }) {
  return <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><h3 className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone === "emerald" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{title}</h3><ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600 dark:text-slate-400">{items.map((item) => <li key={item} className="flex gap-2"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "emerald" ? "bg-emerald-500" : "bg-red-500"}`} aria-hidden="true" />{item}</li>)}</ul></div>;
}
