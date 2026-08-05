"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, RefreshCw, Settings2, Trash2, X } from "lucide-react";
import { DEBASS_MODEL } from "@/lib/debass/types";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import DebassKeyPanel from "./DebassKeyPanel";
import { ASSISTANT_SETTINGS_OPEN_EVENT } from "./AssistantSettingsEvents";
import { Card, Pill, SecondaryButton } from "./ui";

export default function AssistantSettings({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const { developmentMockEnabled, healthState, keyState, hasRememberedKey, clearAssistantSession, refreshHealth, model } = useDebassWorkspace();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(ASSISTANT_SETTINGS_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(ASSISTANT_SETTINGS_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const status = developmentMockEnabled
    ? { label: "Local development preview", tone: "amber" as const }
    : keyState !== "valid" && healthState === "Connected"
      ? { label: "Key required", tone: "amber" as const }
      : healthState === "Connected"
        ? { label: "Connected", tone: "emerald" as const }
        : healthState === "Connecting"
          ? { label: "Connecting", tone: "amber" as const }
          : healthState === "Disconnected"
            ? { label: "Disconnected", tone: "red" as const }
            : { label: "Unavailable", tone: "slate" as const };

  return (
    <>
      <div className={`group relative ${collapsed ? "flex justify-center" : "min-w-0 flex-1"}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Assistant Settings"
          aria-haspopup="dialog"
          aria-expanded={open}
          title={collapsed ? "Assistant Settings" : undefined}
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 text-sm font-medium text-slate-700 transition hover:bg-black/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10 ${collapsed ? "h-11 w-11 px-0" : "w-full"}`}
        >
          <Settings2 size={17} aria-hidden="true" />
          {!collapsed && <span className="truncate">Assistant Settings</span>}
        </button>
        {collapsed && <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block group-focus-within:block dark:bg-white dark:text-slate-950">Assistant Settings</span>}
      </div>
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onMouseDown={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="assistant-settings-title" onMouseDown={(event) => event.stopPropagation()} className="max-h-[min(760px,calc(100dvh-1.5rem))] w-full max-w-xl overflow-y-auto rounded-[28px] border border-black/10 bg-white/95 p-4 text-slate-900 shadow-2xl shadow-slate-950/20 dark:border-white/15 dark:bg-[#171717]/95 dark:text-slate-100 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300"><Settings2 size={19} aria-hidden="true" /></div><div><h2 id="assistant-settings-title" className="text-lg font-semibold tracking-tight">Assistant Settings</h2><p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">One shared connection for Debate Chat, Mock Drill, Mock Judge, and research uploads.</p></div></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close Assistant Settings" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"><X size={18} aria-hidden="true" /></button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Card className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Connection</span><Pill tone={status.tone}><span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${status.tone === "emerald" ? "bg-emerald-500" : status.tone === "amber" ? "bg-amber-500" : status.tone === "red" ? "bg-red-500" : "bg-slate-400"}`} aria-hidden="true" />{status.label}</span></Pill></div><button type="button" onClick={() => void refreshHealth()} className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"><RefreshCw size={13} aria-hidden="true" /> Refresh health</button></Card>
              <Card className="p-4"><label htmlFor="assistant-model" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">OpenRouter model</label><select id="assistant-model" value={model} disabled aria-describedby="assistant-model-help" className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-200"><option value={DEBASS_MODEL}>{DEBASS_MODEL}</option></select><p id="assistant-model-help" className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Debass currently documents one supported free-tier model.</p></Card>
            </div>

            {!developmentMockEnabled && <div className="mt-4"><DebassKeyPanel /></div>}
            {developmentMockEnabled && <div className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50/70 px-3 py-3 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/[0.08] dark:text-amber-200"><span className="font-semibold">Local development preview.</span> No Debass request or OpenRouter key is needed in this mode.</div>}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10"><div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><KeyRound size={14} aria-hidden="true" /> {hasRememberedKey ? "Key remembered on this device" : "Key stays in memory by default"}</div><SecondaryButton type="button" onClick={clearAssistantSession} className="min-h-9 px-3 text-xs"><Trash2 size={14} aria-hidden="true" /> Clear local assistant state</SecondaryButton></div>
            <p className="mt-3 text-[11px] leading-4 text-slate-500 dark:text-slate-400">Clearing local assistant state resets conversation, drill, judge, and document status shown in this dashboard session. It does not delete Debass documents.</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
