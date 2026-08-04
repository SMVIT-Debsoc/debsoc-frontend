"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardPenLine, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { debassClient } from "@/lib/debass/client";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { Card, EmptyState, Field, PrimaryButton, SecondaryButton } from "./ui";
import { AssistantSettingsPrompt, DebassWorkspaceHeader, LocalMarkdown } from "./DebassWorkspaceUI";

export default function RealMockDrillWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { acceptedKey, keyState, model, assistantSessionVersion } = useDebassWorkspace();
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<{ response: string; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const analyze = async () => {
    if (!topic.trim() || !prompt.trim() || loading || keyState !== "valid" || !acceptedKey) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      setResponse(await debassClient.drill(acceptedKey, topic.trim(), prompt.trim(), controller.signal, model));
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Drill analysis could not be completed.");
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
  };

  return (
    <div className={`w-full min-w-0 space-y-5 ${embedded ? "min-h-[620px]" : "mx-auto max-w-6xl"}`}>
      {!embedded && <DebassWorkspaceHeader title="Mock Drill" subtitle="Submit a debate topic and argument prompt for focused debate analysis." />}
      <div className={`grid gap-5 ${embedded ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.7fr)]"}`}>
        <Card className="min-h-[560px] p-4 sm:p-6"><div className="flex items-start gap-2"><ClipboardPenLine size={18} className="mt-0.5 text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><div><h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Prepare a drill</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The topic and prompt are sent exactly as the Debass drill contract expects.</p></div></div><div className="mt-5 space-y-4"><Field label="Topic or motion"><input value={topic} onChange={(event) => { setTopic(event.target.value); setResponse(null); }} placeholder="This House would..." className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400" /></Field><Field label="Argument or prompt"><textarea value={prompt} onChange={(event) => { setPrompt(event.target.value); setResponse(null); }} rows={embedded ? 16 : 13} placeholder="Write the argument or drill prompt you want analyzed..." className="min-h-64 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400" /></Field><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10"><SecondaryButton type="button" onClick={reset} disabled={!topic && !prompt && !response && !loading}><RotateCcw size={15} aria-hidden="true" /> Reset</SecondaryButton><PrimaryButton type="button" onClick={() => void analyze()} disabled={!topic.trim() || !prompt.trim() || keyState !== "valid" || loading}>{loading ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Analyzing…</> : <><Sparkles size={15} aria-hidden="true" /> Analyze drill</>}</PrimaryButton></div></div></Card>
        <Card className="min-h-[560px] p-4 sm:p-6"><div><h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Debate Analysis</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Only fields returned by the API are displayed.</p></div><div className="mt-5">{loading ? <div className="flex min-h-[360px] flex-col items-center justify-center text-center" aria-live="polite"><Loader2 size={28} className="animate-spin text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">Preparing debate analysis…</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This can take several seconds.</p></div> : response ? <div className="space-y-4"><section className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Response</h3><div className="mt-3"><LocalMarkdown content={response.response} /></div></section><section className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Feedback</h3><div className="mt-3"><LocalMarkdown content={response.feedback} /></div></section><SecondaryButton type="button" onClick={() => void analyze()} disabled={loading || keyState !== "valid"} className="w-full"><RotateCcw size={14} aria-hidden="true" /> Retry analysis</SecondaryButton></div> : error ? <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-400/20 dark:bg-red-400/[0.08]" role="alert"><p className="text-sm font-medium text-red-900 dark:text-red-200">{error}</p><SecondaryButton type="button" onClick={() => void analyze()} disabled={loading || keyState !== "valid"}><RotateCcw size={14} aria-hidden="true" /> Try again</SecondaryButton></div> : <EmptyState title="Your analysis will appear here" body="Add a topic and prompt, validate your key, then choose Analyze drill." />}</div></Card>
      </div>
      {!embedded && <AssistantSettingsPrompt />}
    </div>
  );
}
