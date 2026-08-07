"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Gavel, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { debassClient } from "@/lib/debass/client";
import { safeDebassErrorMessage } from "@/lib/debass/safe-error";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { Card, Field, PrimaryButton, SecondaryButton } from "./ui";
import { AssistantSettingsPrompt, DebassWorkspaceHeader, LocalMarkdown } from "./DebassWorkspaceUI";
import HowToUseCard from "./HowToUseCard";
import AnalysisTransitionLayout, { AnalysisResetButton, AnalysisResultReveal } from "./AnalysisTransitionLayout";

type JudgeResult = { score: number; reasoning: string; strengths: string[]; weaknesses: string[] };

export default function RealMockJudgeWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { acceptedKey, keyState, model, assistantSessionVersion } = useDebassWorkspace();
  const [argument, setArgument] = useState("");
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparationExpanded, setPreparationExpanded] = useState(true);
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
    setPreparationExpanded(false);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const nextResult = await debassClient.judge(acceptedKey, argument.trim(), controller.signal, model);
      if (!controller.signal.aborted) {
        if (!nextResult.reasoning.trim() && nextResult.strengths.length === 0 && nextResult.weaknesses.length === 0) setError("No feedback was returned. Try again.");
        else setResult(nextResult);
      }
    } catch (caught) {
      if (!controller.signal.aborted) setError(safeDebassErrorMessage(caught, "judge"));
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
    setPreparationExpanded(true);
  };

  const analysisActive = loading || Boolean(result) || Boolean(error);

  return (
    <div className={`w-full min-w-0 space-y-5 ${embedded ? "min-h-[620px]" : "mx-auto max-w-6xl"}`}>
      {!embedded && <><DebassWorkspaceHeader title="Mock Judge" subtitle="Review a speech with the real Debass judging response and returned criteria." /><HowToUseCard kind="judge" /></>}
      <AnalysisTransitionLayout analysisActive={analysisActive} stacked={embedded}>
        <Card className="p-4 sm:p-6">
          {analysisActive && !preparationExpanded && <button type="button" aria-expanded={false} aria-controls="judge-preparation-fields" onClick={() => setPreparationExpanded(true)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 text-left transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Gavel size={18} className="shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">Argument preparation</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{argument.slice(0, 120)}</span></span>
              <span className="text-xs font-medium text-primary">Edit</span><ChevronDown size={16} className="text-muted-foreground" aria-hidden="true" />
            </button>}
            <div id="judge-preparation-fields" hidden={analysisActive && !preparationExpanded}><div className="flex items-start gap-2"><Gavel size={18} className="mt-0.5 text-primary" aria-hidden="true" /><div><h2 className="text-base font-semibold text-foreground">Prepare an argument</h2><p className="mt-1 text-sm text-muted-foreground">The argument is sent to Debass with the documented empty rubric object.</p></div></div><div className="mt-5 space-y-4"><Field label="Speech or argument"><textarea value={argument} onChange={(event) => { setArgument(event.target.value); setResult(null); setError(null); }} rows={embedded ? 18 : 16} placeholder="Paste or write the speech you want reviewed..." className="min-h-72 w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30" /></Field><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><SecondaryButton type="button" onClick={reset} disabled={!argument && !result && !loading}><RotateCcw size={15} aria-hidden="true" /> Reset</SecondaryButton><PrimaryButton type="button" onClick={() => void judge()} disabled={!argument.trim() || keyState !== "valid" || loading}>{loading ? <><Loader2 size={15} className="motion-safe:animate-spin" aria-hidden="true" /> Reviewing argument…</> : <><Sparkles size={15} aria-hidden="true" /> Review Argument</>}</PrimaryButton></div></div></div>
        </Card>
        <Card className="p-4 sm:p-6"><div className="flex items-start gap-2"><Gavel size={18} className="mt-0.5 text-primary" aria-hidden="true" /><div><h2 className="text-base font-semibold text-foreground">Judge Feedback</h2><p className="mt-1 text-sm text-muted-foreground">Scores and feedback appear only when returned by Debass.</p></div></div><div className="mt-5" aria-busy={loading}>{loading ? <div className="flex min-h-[240px] flex-col items-center justify-center text-center" role="status" aria-live="polite"><Loader2 size={28} className="motion-safe:animate-spin text-primary" aria-hidden="true" /><p className="mt-4 text-sm font-medium text-foreground">Reviewing argument…</p><p className="mt-1 text-xs text-muted-foreground">The real Debass response will appear here.</p><div className="mt-6"><AnalysisResetButton onReset={reset} /></div></div> : result ? <AnalysisResultReveal contentKey="judge-result"><div className="space-y-4"><div className="rounded-xl border border-primary/20 bg-primary/10 p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Returned score</span><span className="text-2xl font-semibold text-foreground">{result.score}</span></div></div><section className="rounded-xl border border-border bg-card p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Reasoning</h3><div className="mt-3"><LocalMarkdown content={result.reasoning} /></div></section><div className="grid gap-3 sm:grid-cols-2"><FeedbackList title="Strengths" items={result.strengths} tone="emerald" /><FeedbackList title="Weaknesses" items={result.weaknesses} tone="red" /></div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><AnalysisResetButton onReset={reset} /><SecondaryButton type="button" onClick={() => void judge()} disabled={loading || keyState !== "valid"}><RotateCcw size={14} aria-hidden="true" /> Retry review</SecondaryButton></div></div></AnalysisResultReveal> : error ? <AnalysisResultReveal contentKey="judge-error"><div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4" role="alert"><p className="text-sm font-medium text-destructive">{error}</p><div className="flex flex-wrap items-center justify-between gap-3"><AnalysisResetButton onReset={reset} /><SecondaryButton type="button" onClick={() => void judge()} disabled={loading || keyState !== "valid"}><RotateCcw size={14} aria-hidden="true" /> Retry</SecondaryButton></div></div></AnalysisResultReveal> : null}</div></Card>
      </AnalysisTransitionLayout>
      {!embedded && <AssistantSettingsPrompt />}
    </div>
  );
}

function FeedbackList({ title, items, tone }: { title: string; items: string[]; tone: "emerald" | "red" }) {
  return <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><h3 className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone === "emerald" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{title}</h3><ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600 dark:text-slate-400">{items.map((item) => <li key={item} className="flex gap-2"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "emerald" ? "bg-emerald-500" : "bg-red-500"}`} aria-hidden="true" />{item}</li>)}</ul></div>;
}
