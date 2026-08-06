"use client";

import { ClipboardPaste, Eye, EyeOff, Info, KeyRound, Loader2, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { Card, Pill, PrimaryButton, SecondaryButton } from "./ui";

export default function DebassKeyPanel() {
  const { draftKey, keyError, storageError, keyState, rememberKey, hasRememberedKey, setDraftKey, setRememberKey, removeRememberedKey, validateKey, clearKey } = useDebassWorkspace();
  const [showKey, setShowKey] = useState(false);
  const [canPaste, setCanPaste] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCanPaste(Boolean(window.isSecureContext && navigator.clipboard?.readText));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const pasteKey = async () => {
    if (!canPaste) return;
    try {
      const value = await navigator.clipboard.readText();
      if (value) setDraftKey(value);
    } catch {
      // Clipboard permission is optional; the field remains usable manually.
    }
  };

  const confirmRemove = () => {
    removeRememberedKey();
    setRemoveOpen(false);
  };

  const actionLabel = keyState === "valid" ? "Reconnect" : "Validate & Connect";

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground"><KeyRound size={17} aria-hidden="true" /></div>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-foreground">OpenRouter API key</h2><details className="group relative"><summary className="flex min-h-8 min-w-8 cursor-pointer list-none items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden" aria-label="How to get an OpenRouter key" title="How to get an OpenRouter key"><Info size={15} aria-hidden="true" /></summary><div className="absolute left-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover p-4 text-xs leading-5 text-popover-foreground shadow-xl"><h3 className="font-semibold">How to get an OpenRouter key</h3><ol className="mt-2 list-decimal space-y-1 pl-4"><li>Open OpenRouter and sign in.</li><li>Open <span className="font-medium">Keys</span> and create a key.</li><li>Copy the key and paste it into this field.</li></ol><a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-9 items-center rounded-full border border-border px-3 font-semibold text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Open OpenRouter Keys</a></div></details></div><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">Stored in this browser only. Sent to the configured DebSoc AI service only when you explicitly validate or use it.</p></div>
        </div>
        {keyState === "valid" && <Pill tone="emerald"><span className="inline-flex items-center gap-1"><ShieldCheck size={13} aria-hidden="true" /> Connected</span></Pill>}
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1"><input id="assistant-openrouter-key" type={showKey ? "text" : "password"} value={draftKey} onChange={(event) => setDraftKey(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void validateKey(); }} autoComplete="off" spellCheck={false} aria-label="OpenRouter API key" aria-describedby="assistant-key-help assistant-key-warning" placeholder="Paste your OpenRouter API key..." disabled={keyState === "validating"} className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:cursor-wait" /><button type="button" onClick={() => setShowKey((visible) => !visible)} aria-label={showKey ? "Hide OpenRouter API key" : "Show OpenRouter API key"} title={showKey ? "Hide key" : "Show key"} className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{showKey ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}</button></div>
        {canPaste && <SecondaryButton type="button" onClick={() => void pasteKey()} disabled={keyState === "validating"} aria-label="Paste OpenRouter API key" title="Paste key" className="shrink-0 px-3"><ClipboardPaste size={16} aria-hidden="true" /><span className="hidden lg:inline">Paste</span></SecondaryButton>}
        <PrimaryButton type="button" onClick={() => void validateKey()} disabled={!draftKey.trim() || keyState === "validating"} className="sm:min-w-36">{keyState === "validating" ? <><Loader2 size={15} className="motion-safe:animate-spin" aria-hidden="true" /> Validating…</> : actionLabel}</PrimaryButton>
        <SecondaryButton type="button" onClick={clearKey} disabled={!draftKey && keyState !== "valid"} aria-label="Clear OpenRouter key" title="Clear key" className="shrink-0 px-3"><Trash2 size={15} aria-hidden="true" /></SecondaryButton>
      </div>
      <div className="mt-3 rounded-xl border border-border bg-muted/50 p-3">
        <label htmlFor="remember-assistant-key" className="flex cursor-pointer items-start gap-3">
          <input id="remember-assistant-key" type="checkbox" checked={rememberKey} onChange={(event) => setRememberKey(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring/40" />
          <span className="min-w-0"><span className="block text-sm font-medium text-foreground">Remember key on this device</span><span id="assistant-key-help" className="mt-0.5 block text-xs leading-5 text-muted-foreground">Stores your key in this browser until you remove it.</span></span>
        </label>
        <p id="assistant-key-warning" className="mt-2 text-[11px] leading-4 text-muted-foreground">Only enable this on a personal, trusted device. Do not use it on a shared or public computer.</p>
        {hasRememberedKey && !removeOpen && <button type="button" onClick={() => setRemoveOpen(true)} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 size={13} aria-hidden="true" /> Remove saved key</button>}
        {removeOpen && <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3" role="alertdialog" aria-labelledby="remove-key-title" aria-describedby="remove-key-description"><div className="flex items-start gap-2"><Trash2 size={16} className="mt-0.5 shrink-0 text-destructive" aria-hidden="true" /><div className="min-w-0"><p id="remove-key-title" className="text-sm font-semibold text-foreground">Remove this saved key?</p><p id="remove-key-description" className="mt-1 text-xs leading-5 text-muted-foreground">DebSoc will stop remembering it on this browser. You can connect again anytime.</p><div className="mt-3 flex flex-wrap gap-2"><PrimaryButton type="button" variant="danger" onClick={confirmRemove} className="min-h-9 px-3 text-xs">Remove key</PrimaryButton><SecondaryButton type="button" onClick={() => setRemoveOpen(false)} className="min-h-9 px-3 text-xs"><X size={14} aria-hidden="true" /> Keep key</SecondaryButton></div></div></div></div>}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className={`text-xs ${keyError || storageError ? "text-destructive" : "text-muted-foreground"}`} role={keyError || storageError ? "alert" : undefined} aria-live={keyError || storageError ? "assertive" : "polite"}>{keyError ?? storageError ?? (keyState === "valid" ? (hasRememberedKey ? "Key accepted and remembered on this device." : "Chat, Drill, Judge, and uploads are ready.") : "Validation is always explicit; a remembered key is never checked automatically.")}</p>
      </div>
    </Card>
  );
}
