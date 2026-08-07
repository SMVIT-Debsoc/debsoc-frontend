"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ClipboardPenLine, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { debassClient } from "@/lib/debass/client";
import { safeDebassErrorMessage } from "@/lib/debass/safe-error";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { Card, Field, PrimaryButton, SecondaryButton } from "./ui";
import { AssistantSettingsPrompt, DebassWorkspaceHeader, LocalMarkdown } from "./DebassWorkspaceUI";
import HowToUseCard from "./HowToUseCard";
import AnalysisTransitionLayout, { AnalysisResetButton, AnalysisResultReveal } from "./AnalysisTransitionLayout";

export default function RealMockDrillWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { acceptedKey, keyState, model, assistantSessionVersion } = useDebassWorkspace();
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<{ response: string; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparationExpanded, setPreparationExpanded] = useState(true);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => {
    requestController.current?.abort();
    const resetTimer = window.setTimeout(() => {
      setTopic("");
      setPrompt("");
      setResponse(null);
      setError(null);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [assistantSessionVersion]);

  useEffect(() => () => requestController.current?.abort(), []);

  const analyze = async () => {
    if (!topic.trim() || !prompt.trim() || loading || keyState !== "valid" || !acceptedKey) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    setPreparationExpanded(false);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const nextResponse = await debassClient.drill(acceptedKey, topic.trim(), prompt.trim(), controller.signal, model);
      if (!controller.signal.aborted) {
        if (!nextResponse.response.trim() && !nextResponse.feedback.trim()) setError("No analysis was returned. Try again.");
        else setResponse(nextResponse);
      }
    } catch (caught) {
      if (!controller.signal.aborted) setError(safeDebassErrorMessage(caught, "drill"));
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
    setTopic("");
    setPrompt("");
    setResponse(null);
    setError(null);
    setLoading(false);
    setPreparationExpanded(true);
  };

  const analysisActive = loading || Boolean(response) || Boolean(error);

  return (
    <div className={`w-full min-w-0 space-y-5 ${embedded ? "min-h-[620px]" : "mx-auto max-w-6xl"}`}>
      {!embedded && <><DebassWorkspaceHeader title="Mock Drill" subtitle="Submit a debate topic and argument prompt for focused debate analysis." /><HowToUseCard kind="drill" /></>}
      <AnalysisTransitionLayout analysisActive={analysisActive} stacked={embedded}>
        <Card className="p-4 sm:p-6">
          {analysisActive && !preparationExpanded && <button type="button" aria-expanded={false} aria-controls="drill-preparation-fields" onClick={() => setPreparationExpanded(true)} className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 text-left transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ClipboardPenLine size={18} className="shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">Drill preparation</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{topic}</span></span>
              <span className="text-xs font-medium text-primary">Edit</span><ChevronDown size={16} className="text-muted-foreground" aria-hidden="true" />
            </button>}
            <div id="drill-preparation-fields" hidden={analysisActive && !preparationExpanded}>
              <div className="flex items-start gap-2"><ClipboardPenLine size={18} className="mt-0.5 text-primary" aria-hidden="true" /><div><h2 className="text-base font-semibold text-foreground">Prepare a drill</h2><p className="mt-1 text-sm text-muted-foreground">The topic and prompt are sent exactly as the Debass drill contract expects.</p></div></div>
              <div className="mt-5 space-y-4"><Field label="Topic or motion"><input value={topic} onChange={(event) => { setTopic(event.target.value); setResponse(null); setError(null); }} placeholder="This House would..." className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30" /></Field><Field label="Argument or prompt"><textarea value={prompt} onChange={(event) => { setPrompt(event.target.value); setResponse(null); setError(null); }} rows={embedded ? 16 : 13} placeholder="Write the argument or drill prompt you want analyzed..." className="min-h-64 w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30" /></Field><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><SecondaryButton type="button" onClick={reset} disabled={!topic && !prompt && !response && !loading}><RotateCcw size={15} aria-hidden="true" /> Reset</SecondaryButton><PrimaryButton type="button" onClick={() => void analyze()} disabled={!topic.trim() || !prompt.trim() || keyState !== "valid" || loading}>{loading ? <><Loader2 size={15} className="motion-safe:animate-spin" aria-hidden="true" /> Preparing analysis…</> : <><Sparkles size={15} aria-hidden="true" /> Analyse Drill</>}</PrimaryButton></div></div>
            </div>
        </Card>
        <Card className="p-4 sm:p-6"><div className="flex items-start gap-2"><Sparkles size={18} className="mt-0.5 text-primary" aria-hidden="true" /><div><h2 className="text-base font-semibold text-foreground">Debate Analysis</h2><p className="mt-1 text-sm text-muted-foreground">Only fields returned by the API are displayed.</p></div></div><div className="mt-5" aria-busy={loading}>{loading ? <div className="flex min-h-[240px] flex-col items-center justify-center text-center" role="status" aria-live="polite"><Loader2 size={28} className="motion-safe:animate-spin text-primary" aria-hidden="true" /><p className="mt-4 text-sm font-medium text-foreground">Preparing analysis…</p><p className="mt-1 text-xs text-muted-foreground">The real Debass response will appear here.</p><div className="mt-6"><AnalysisResetButton onReset={reset} /></div></div> : response ? <AnalysisResultReveal contentKey="drill-response"><div className="space-y-4"><section className="rounded-xl border border-border bg-card p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Response</h3><div className="mt-3"><LocalMarkdown content={response.response} /></div></section><section className="rounded-xl border border-border bg-card p-4"><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Feedback</h3><div className="mt-3"><LocalMarkdown content={response.feedback} /></div></section><div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><AnalysisResetButton onReset={reset} /><SecondaryButton type="button" onClick={() => void analyze()} disabled={loading || keyState !== "valid"}><RotateCcw size={14} aria-hidden="true" /> Retry analysis</SecondaryButton></div></div></AnalysisResultReveal> : error ? <AnalysisResultReveal contentKey="drill-error"><div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4" role="alert"><p className="text-sm font-medium text-destructive">{error}</p><div className="flex flex-wrap items-center justify-between gap-3"><AnalysisResetButton onReset={reset} /><SecondaryButton type="button" onClick={() => void analyze()} disabled={loading || keyState !== "valid"}><RotateCcw size={14} aria-hidden="true" /> Retry</SecondaryButton></div></div></AnalysisResultReveal> : null}</div></Card>
      </AnalysisTransitionLayout>
      {!embedded && <AssistantSettingsPrompt />}
    </div>
  );
}
