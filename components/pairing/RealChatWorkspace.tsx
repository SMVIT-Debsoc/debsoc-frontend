"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, RefreshCw, Send, Sparkles, Trash2 } from "lucide-react";
import { debassClient } from "@/lib/debass/client";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import DebassDocumentsPanel from "./DebassDocumentsPanel";
import { Card, PrimaryButton, SecondaryButton } from "./ui";
import { ChatMessageSkeleton } from "./Loading";
import { AssistantSettingsPrompt, DebassWorkspaceHeader, LocalMarkdown, LocalSources } from "./DebassWorkspaceUI";

type Message = { id: string; role: "user" | "assistant"; content: string; citations?: string[] };

export default function RealChatWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { acceptedKey, keyState, model, assistantSessionVersion } = useDebassWorkspace();
  const [messages, setMessages] = useState<Message[]>([]);
  const [composer, setComposer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCounter = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  useEffect(() => () => requestController.current?.abort(), []);

  useEffect(() => {
    requestController.current?.abort();
    const resetTimer = window.setTimeout(() => {
      setMessages([]);
      setComposer("");
      setError(null);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [assistantSessionVersion]);

  const send = async (content = composer, appendUser = true) => {
    const prompt = content.trim();
    if (!prompt || loading || keyState !== "valid" || !acceptedKey) return;
    setError(null);
    setComposer("");
    if (appendUser) setMessages((current) => [...current, { id: `user-${messageCounter.current++}`, role: "user", content: prompt }]);
    setLoading(true);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const response = await debassClient.chat(acceptedKey, prompt, controller.signal, model);
      setMessages((current) => [...current, { id: `assistant-${messageCounter.current++}`, role: "assistant", content: response.content, citations: response.citations }]);
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Chat could not complete that request.");
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  };

  const retry = () => {
    if (loading) return;
    const latestUser = [...messages].reverse().find((message) => message.role === "user");
    if (!latestUser) return;
    const index = messages.findIndex((message) => message.id === latestUser.id);
    setMessages(messages.slice(0, index + 1));
    void send(latestUser.content, false);
  };

  const clear = () => {
    requestController.current?.abort();
    requestController.current = null;
    setMessages([]);
    setComposer("");
    setError(null);
    setLoading(false);
    composerRef.current?.focus();
  };

  return (
    <div className={`flex w-full min-w-0 flex-col gap-4 ${embedded ? "min-h-[620px]" : "mx-auto min-h-[min(760px,calc(100dvh-7rem))] max-w-6xl"}`}>
      {!embedded && <DebassWorkspaceHeader title="DebSoc Debate Assistant" subtitle="Ask questions, structure arguments, and research with your connected Debass workspace." />}
      <div className={embedded ? "min-h-0 flex-1" : "grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.38fr)]"}>
      <Card className={`flex min-h-0 flex-col overflow-hidden p-0 ${embedded ? "" : "min-h-[min(720px,calc(100dvh-11rem))]"}`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:px-5">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300"><Sparkles size={17} aria-hidden="true" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">DebSoc debate assistant</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">Live responses from Debass when a key is accepted</p></div></div>
          <SecondaryButton type="button" onClick={clear} disabled={messages.length === 0 && !composer && !loading} className="shrink-0 px-3 text-xs"><Trash2 size={14} aria-hidden="true" /><span className="hidden sm:inline">Clear</span></SecondaryButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6" aria-busy={loading}>
          {messages.length === 0 ? <div className="flex min-h-[320px] flex-col items-center justify-center py-8 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-300"><MessageCircle size={26} aria-hidden="true" /></div><h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Start with a debate question</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Validate a key above, then ask for structure, rebuttal practice, or a research summary.</p></div> : <div className="mx-auto max-w-3xl space-y-5">{messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[min(90%,680px)] rounded-2xl px-4 py-3 ${message.role === "user" ? "bg-indigo-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"}`}>{message.role === "assistant" ? <LocalMarkdown content={message.content} /> : <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>}{message.role === "assistant" && message.citations && message.citations.length > 0 && <LocalSources citations={message.citations} local={false} />}</div></div>)}{loading && <div role="status" aria-live="polite"><ChatMessageSkeleton /><span className="sr-only">Debass is preparing a response</span></div>}{error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800 dark:border-red-400/20 dark:bg-red-400/[0.08] dark:text-red-200" role="alert">{error}</div>}{!loading && messages.some((message) => message.role === "assistant") && <button type="button" onClick={retry} className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"><RefreshCw size={13} aria-hidden="true" /> Retry latest response</button>}<div ref={bottomRef} /></div>}
        </div>
        <div className="border-t border-slate-200 p-3 dark:border-white/10 sm:p-4"><div className="mx-auto max-w-3xl rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 dark:border-white/15 dark:bg-white/[0.05]"><textarea ref={composerRef} value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={2} aria-label="Ask DebSoc debate assistant" placeholder={keyState === "valid" ? "Ask a debate question… (Enter to send, Shift+Enter for a new line)" : "Validate your key above to start chatting"} disabled={keyState !== "valid" || loading} className="min-h-14 w-full resize-none border-0 bg-transparent px-2 py-1 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-slate-100 dark:placeholder:text-slate-500" /><div className="flex items-center justify-between gap-2 px-1 pt-1"><span className="text-[11px] text-slate-400 dark:text-slate-500">Responses may take a few seconds</span><PrimaryButton type="button" onClick={() => void send()} disabled={!composer.trim() || keyState !== "valid" || loading} className="min-h-9 px-3 text-xs"><Send size={14} aria-hidden="true" /> Send</PrimaryButton></div></div></div>
      </Card>
      {!embedded && <aside className="min-w-0 lg:sticky lg:top-6" aria-label="Research Documents"><DebassDocumentsPanel /></aside>}
      </div>
      {!embedded && <AssistantSettingsPrompt />}
    </div>
  );
}
