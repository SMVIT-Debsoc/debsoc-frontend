"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Settings2, ShieldCheck, Sparkles, X } from "lucide-react";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import DebassKeyPanel from "./DebassKeyPanel";
import DebsocOverlayScrollbar from "./DebsocOverlayScrollbar";
import { ASSISTANT_SETTINGS_OPEN_EVENT } from "./AssistantSettingsEvents";
import { Pill } from "./ui";
import { DEBASS_KEY_PRIVACY_COPY } from "@/lib/debass/privacy";

export default function AssistantSettings({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const { healthState, keyState } = useDebassWorkspace();

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

  const status = keyState === "validating"
    ? { label: "Validating", tone: "amber" as const, description: "Checking the connection securely." }
    : keyState === "valid"
      ? { label: "Connected", tone: "emerald" as const, description: "DebSoc AI is ready to use." }
      : keyState === "invalid"
        ? { label: "Invalid API Key", tone: "red" as const, description: "Check the key and try again." }
        : healthState === "Unavailable"
          ? { label: "Unavailable", tone: "slate" as const, description: "The AI service is not configured for this environment." }
          : { label: "API Key Required", tone: "amber" as const, description: "Connect a key to use DebSoc AI." };

  const modelLabel = "Nemotron 3 Super 120B";

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
          className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border bg-secondary px-3 text-sm font-medium text-secondary-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${collapsed ? "h-11 w-11 px-0" : "w-full"}`}
        >
          <Settings2 size={17} aria-hidden="true" />
          {!collapsed && <span className="truncate">Assistant Settings</span>}
        </button>
        {collapsed && <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg group-hover:block group-focus-within:block">Assistant Settings</span>}
      </div>
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/40 p-3 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onMouseDown={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="assistant-settings-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl overflow-hidden rounded-[28px] border border-border bg-card/95 text-foreground shadow-2xl shadow-foreground/10 backdrop-blur-xl">
          <DebsocOverlayScrollbar className="max-h-[min(760px,calc(100dvh-1.5rem))]" style={{ height: "min(760px, calc(100dvh - 1.5rem))" }} contentStyle={{ padding: "1rem" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles size={19} aria-hidden="true" /></div><div><h2 id="assistant-settings-title" className="text-lg font-semibold tracking-tight">DebSoc AI</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Connect your OpenRouter API key to use the debate learning tools.</p></div></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close AI Connection Center" title="Close" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X size={18} aria-hidden="true" /></button>
            </div>

            <div className="mt-5 rounded-2xl border border-border bg-muted/35 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Connection status</p><p className="mt-1 text-sm text-muted-foreground">{status.description}</p></div>
                <span aria-live="polite"><Pill tone={status.tone}><span className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${status.tone === "emerald" ? "bg-chart-3" : status.tone === "amber" ? "bg-chart-4" : status.tone === "red" ? "bg-destructive" : "bg-muted-foreground"}`} aria-hidden="true" />{status.label}</span></Pill></span>
              </div>
              <div className="mt-4 border-t border-border pt-3"><p className="text-xs text-muted-foreground">Powered by</p><p className="mt-1 text-sm font-semibold text-foreground">{modelLabel}</p><p className="mt-0.5 text-xs text-muted-foreground">Managed automatically by DebSoc</p></div>
            </div>

            <div className="mt-4"><DebassKeyPanel /></div>

            <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/50 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck size={16} className="text-primary" aria-hidden="true" /> Stored locally</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{DEBASS_KEY_PRIVACY_COPY}</p></div>
              <div className="rounded-2xl border border-border bg-background/50 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Used by</p><ul className="mt-2 space-y-1 text-sm text-foreground"><li>Debate Assistant</li><li>Mock Drill</li><li>Mock Judge</li></ul></div>
            </div>
          </DebsocOverlayScrollbar>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
