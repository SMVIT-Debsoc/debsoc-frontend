"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardPenLine, Loader2, RotateCcw, Sparkles } from "lucide-react";
import SearchableDropdown from "@/components/smoothui/components/searchable-dropdown";
import { getLocalDrillFixture, LOCAL_DRILL_PERSPECTIVES, LOCAL_DRILL_STANCES } from "@/lib/dev/debass-mock/fixtures";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { sparMotionCategories } from "@/types/spar-motions";
import { Card, EmptyState, Field, Pill, PrimaryButton, SecondaryButton } from "./ui";
import { LocalMarkdown, LocalPreviewNotice, LocalWorkspaceHeader } from "./DebassWorkspaceUI";
import RealMockDrillWorkspace from "./RealMockDrillWorkspace";

const motionItems = sparMotionCategories.map((category) => ({
  id: category.id,
  label: category.label,
  value: category.label,
  description: category.description,
  searchTerms: category.searchTerms,
}));

export default function MockDrillWorkspace({ developmentDebassMockEnabled = false, embedded = false }: { developmentDebassMockEnabled?: boolean; embedded?: boolean }) {
  if (!developmentDebassMockEnabled) {
    return <RealMockDrillWorkspace embedded={embedded} />;
  }

  return <LocalMockDrillWorkspace embedded={embedded} />;
}

function LocalMockDrillWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { assistantSessionVersion } = useDebassWorkspace();
  const defaultMotion = motionItems[0]?.id ?? "";
  const [motionId, setMotionId] = useState<string>(defaultMotion);
  const [perspective, setPerspective] = useState(LOCAL_DRILL_PERSPECTIVES[0]?.id ?? "government");
  const [stance, setStance] = useState(LOCAL_DRILL_STANCES[0]?.id ?? "constructive");
  const [response, setResponse] = useState("");
  const [analysis, setAnalysis] = useState<ReturnType<typeof getLocalDrillFixture> | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedMotion = useMemo(() => motionItems.find((item) => item.id === motionId)?.label ?? "Selected motion", [motionId]);
  const selectedPerspective = useMemo(() => LOCAL_DRILL_PERSPECTIVES.find((item) => item.id === perspective)?.label ?? "Government", [perspective]);
  const selectedStance = useMemo(() => LOCAL_DRILL_STANCES.find((item) => item.id === stance)?.label ?? "Constructive case", [stance]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setResponse("");
      setAnalysis(null);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [assistantSessionVersion]);

  const analyze = () => {
    if (!response.trim() || loading) return;
    setLoading(true);
    setAnalysis(null);
    timerRef.current = setTimeout(() => {
      setAnalysis(getLocalDrillFixture({ motion: selectedMotion, perspective: selectedPerspective, stance: selectedStance, response }));
      setLoading(false);
    }, 750);
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResponse("");
    setAnalysis(null);
    setLoading(false);
  };

  return (
    <div className={`w-full min-w-0 space-y-5 ${embedded ? "min-h-[620px]" : "mx-auto max-w-6xl"}`}>
      {!embedded && <LocalWorkspaceHeader title="Mock Drill" subtitle="Practice an argument, then review a structured debate analysis." />}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.7fr)]">
        <Card className="min-h-[560px] p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><div className="flex items-center gap-2"><ClipboardPenLine size={18} className="text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Prepare a drill</h2></div><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use the same focused writing space you would use before a live drill.</p></div>
            <Pill tone="amber">Local preview</Pill>
          </div>
          <div className="mt-5 space-y-4">
            <Field label="Motion type">
              <SearchableDropdown items={motionItems} emptyMessage="No motion types found" label="Motion type" placeholder="Search motion types..." value={motionId} onSelect={(item) => { setMotionId(item.id); setAnalysis(null); }} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Perspective (local preview)">
                <SearchableDropdown searchable={false} items={LOCAL_DRILL_PERSPECTIVES} emptyMessage="No perspectives found" label="Perspective" placeholder="Select perspective" value={perspective} onSelect={(item) => { setPerspective(item.id); setAnalysis(null); }} />
              </Field>
              <Field label="Case emphasis (local preview)">
                <SearchableDropdown searchable={false} items={LOCAL_DRILL_STANCES} emptyMessage="No case emphases found" label="Case emphasis" placeholder="Select emphasis" value={stance} onSelect={(item) => { setStance(item.id); setAnalysis(null); }} />
              </Field>
            </div>
            <Field label="Your argument" hint="Write a claim, mechanism, and impact. The local preview accepts any text so the loading and result states are easy to test.">
              <textarea value={response} onChange={(event) => { setResponse(event.target.value); setAnalysis(null); }} rows={12} placeholder="Write your opening argument here..." className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400" />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
              <SecondaryButton type="button" onClick={reset} disabled={!response && !analysis && !loading}><RotateCcw size={15} aria-hidden="true" /> Reset</SecondaryButton>
              <PrimaryButton type="button" onClick={analyze} disabled={!response.trim() || loading}>{loading ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Analyzing locally...</> : <><Sparkles size={15} aria-hidden="true" /> Analyze response</>}</PrimaryButton>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">Debate Analysis</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Strengths, weaknesses, and one next move.</p></div>{analysis && <Pill tone="amber">Development mock response</Pill>}</div>
          <div className="mt-5">
            {loading ? <div className="flex min-h-[360px] flex-col items-center justify-center text-center" aria-live="polite"><Loader2 size={28} className="animate-spin text-indigo-600 dark:text-indigo-300" aria-hidden="true" /><p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">Reviewing your local drill...</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This preview uses a deterministic response.</p></div> : analysis ? <div className="space-y-3"><div className="rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-400/[0.08]"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">Local preview score</span><span className="text-2xl font-semibold text-amber-900 dark:text-amber-200">76<span className="text-sm font-medium">/100</span></span></div><p className="mt-2 text-xs leading-5 text-amber-900/75 dark:text-amber-200/75">Sample score for layout testing, not an adjudicator result.</p></div><details open className="group rounded-xl border border-slate-200 p-4 dark:border-white/10"><summary className="cursor-pointer list-none text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:text-slate-100">Development mock response</summary><div className="mt-3"><LocalMarkdown content={analysis.feedback} /></div></details><SecondaryButton type="button" onClick={analyze} disabled={loading || !response.trim()} className="w-full"><RotateCcw size={14} aria-hidden="true" /> Retry preview analysis</SecondaryButton></div> : <EmptyState title="Your analysis will appear here" body="Write a response and choose Analyze to see the local loading and analysis states." />}
          </div>
        </Card>
      </div>
      {!embedded && <LocalPreviewNotice>The controls and critique are deterministic local fixtures. Perspective and case emphasis are mock-only context and are not sent to Debass.</LocalPreviewNotice>}
    </div>
  );
}
