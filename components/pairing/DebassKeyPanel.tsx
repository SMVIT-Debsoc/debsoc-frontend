"use client";

import { Eye, EyeOff, KeyRound, Loader2, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { Card, Pill, PrimaryButton, SecondaryButton } from "./ui";

export default function DebassKeyPanel() {
  const { developmentMockEnabled, draftKey, keyError, keyState, rememberKey, setRememberKey, setDraftKey, validateKey, clearKey, refreshHealth } = useDebassWorkspace();
  const [showKey, setShowKey] = useState(false);

  if (developmentMockEnabled) return null;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300"><KeyRound size={17} aria-hidden="true" /></div>
          <div><h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Connect your OpenRouter key</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">By default the key stays in memory and is sent only to the configured Debass backend. You can optionally remember it encrypted on this device; it is never stored on AWS, in URLs, or in the database.</p></div>
        </div>
        {keyState === "valid" && <Pill tone="emerald"><span className="inline-flex items-center gap-1"><ShieldCheck size={13} aria-hidden="true" /> Key accepted</span></Pill>}
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1"><input type={showKey ? "text" : "password"} value={draftKey} onChange={(event) => setDraftKey(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void validateKey(); }} autoComplete="off" spellCheck={false} aria-label="OpenRouter API key" placeholder="sk-or-v1-…" disabled={keyState === "validating"} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 disabled:cursor-wait dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400" /><button type="button" onClick={() => setShowKey((visible) => !visible)} aria-label={showKey ? "Hide OpenRouter API key" : "Show OpenRouter API key"} className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white">{showKey ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}</button></div>
        <PrimaryButton type="button" onClick={() => void validateKey()} disabled={!draftKey.trim() || keyState === "validating"} className="sm:min-w-32">{keyState === "validating" ? <><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Checking</> : "Validate key"}</PrimaryButton>
        <SecondaryButton type="button" onClick={clearKey} disabled={!draftKey && keyState !== "valid"} aria-label="Clear OpenRouter key" title="Clear key" className="shrink-0 px-3"><Trash2 size={15} aria-hidden="true" /></SecondaryButton>
      </div>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={rememberKey} onChange={(event) => setRememberKey(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-white/20 dark:bg-white/10" /> Remember on this device <span className="text-slate-400 dark:text-slate-500">(encrypted browser storage)</span></label>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className={`text-xs ${keyError ? "text-red-700 dark:text-red-300" : "text-slate-500 dark:text-slate-400"}`} role={keyError ? "alert" : undefined}>{keyError ?? (keyState === "valid" ? "Chat, Drill, Judge, and uploads are ready." : "Validate the key before sending a request.")}</p>
        <button type="button" onClick={() => void refreshHealth()} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"><RefreshCw size={13} aria-hidden="true" /> Refresh status</button>
      </div>
    </Card>
  );
}
