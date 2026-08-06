"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpenText, FileText, RefreshCw, Send, Sparkles, Trash2 } from "lucide-react";
import { debassClient } from "@/lib/debass/client";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import DebassDocumentsPanel from "./DebassDocumentsPanel";
import { Card, PrimaryButton, SecondaryButton } from "./ui";
import { ChatMessageSkeleton } from "./Loading";
import { AssistantSettingsPrompt, DebassWorkspaceHeader, LocalMarkdown } from "./DebassWorkspaceUI";
import HowToUseCard from "./HowToUseCard";
import DebsocOverlayScrollbar from "./DebsocOverlayScrollbar";

type Message = { id: string; role: "user" | "assistant"; content: string; citations?: string[] };

const SUGGESTED_QUESTIONS = [
  "Explain Point of Information",
  "Summarize BP Rules",
  "Compare AP vs BP",
  "What is burden of proof?",
  "Explain adjudication criteria",
  "Find arguments for AI regulation",
];

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
      if (!controller.signal.aborted) {
        setMessages((current) => [...current, { id: `assistant-${messageCounter.current++}`, role: "assistant", content: response.content, citations: response.citations }]);
      }
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

  const selectSuggestion = (suggestion: string) => {
    setComposer(suggestion);
    window.requestAnimationFrame(() => composerRef.current?.focus());
  };

  return (
    <div className={`flex w-full min-w-0 flex-col gap-4 ${embedded ? "min-h-[620px]" : "mx-auto min-h-[min(760px,calc(100dvh-7rem))] max-w-6xl"}`}>
      {!embedded && <><DebassWorkspaceHeader title="DebSoc Knowledge Assistant" subtitle="Answers use indexed DebSoc resources and documents you upload here." /><HowToUseCard kind="chat" /></>}
      <div className={embedded ? "min-h-0 flex-1" : "grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.38fr)]"}>
        <Card className={`flex min-h-0 flex-col overflow-hidden p-0 ${embedded ? "" : "min-h-[min(720px,calc(100dvh-11rem))]"}`}>
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles size={17} aria-hidden="true" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">DebSoc Knowledge Assistant</p><p className="truncate text-xs text-muted-foreground">Focused debate answers from your connected knowledge workspace</p></div></div>
            <SecondaryButton type="button" onClick={clear} disabled={messages.length === 0 && !composer && !loading} className="shrink-0 px-3 text-xs"><Trash2 size={14} aria-hidden="true" /><span className="hidden sm:inline">Clear</span></SecondaryButton>
          </div>
          <div className="min-h-0 flex-1" aria-busy={loading}>
          <DebsocOverlayScrollbar className="h-full">
            <div className="px-3 py-5 sm:px-6">
            {messages.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><BookOpenText size={27} aria-hidden="true" /></div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">Your Debate Knowledge Assistant</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Ask about indexed DebSoc knowledge or documents you upload. Choose a prompt below to begin.</p>
                <div className="mt-5 flex max-w-2xl flex-wrap justify-center gap-2" aria-label="Suggested questions">
                  {SUGGESTED_QUESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => selectSuggestion(suggestion)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"> <FileText size={14} className="text-primary" aria-hidden="true" /> {suggestion}</button>)}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.map((message) => message.role === "assistant" ? (
                  <div key={message.id} className="rounded-2xl border border-primary/20 bg-card p-4 shadow-sm sm:p-5">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary"><BookOpenText size={15} aria-hidden="true" /> Answer</div>
                    <LocalMarkdown content={message.content} />
                  </div>
                ) : <div key={message.id} className="flex justify-end"><div className="max-w-[min(90%,680px)] rounded-2xl bg-primary px-4 py-3 text-primary-foreground"><p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p></div></div>)}
                {loading && <div role="status" aria-live="polite"><ChatMessageSkeleton /><p className="mt-2 text-xs text-muted-foreground">Thinking…</p></div>}
                {error && <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive" role="alert"><p>{error}</p>{messages.some((message) => message.role === "user") && <button type="button" onClick={retry} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Retry</button>}</div>}
                {!loading && !error && messages.some((message) => message.role === "assistant") && <button type="button" onClick={retry} className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RefreshCw size={13} aria-hidden="true" /> Retry latest response</button>}
                <div ref={bottomRef} />
              </div>
            )}
            </div>
          </DebsocOverlayScrollbar>
          </div>
          <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 p-3 backdrop-blur sm:p-4"><div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-2 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"><textarea ref={composerRef} value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={2} aria-label="Ask DebSoc Knowledge Assistant" placeholder={keyState === "valid" ? "Ask about your uploaded documents or DebSoc knowledge…" : "Validate your key above to start chatting"} disabled={keyState !== "valid" || loading} className="min-h-14 w-full resize-none border-0 bg-transparent px-2 py-1 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed" /><div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1"><span className="text-[11px] text-muted-foreground">PDF, DOCX, Markdown • Maximum file size 8 MB</span><PrimaryButton type="button" onClick={() => void send()} disabled={!composer.trim() || keyState !== "valid" || loading} className="min-h-9 px-3 text-xs"><Send size={14} aria-hidden="true" /> Send</PrimaryButton></div></div></div>
        </Card>
        {!embedded && <aside className="min-w-0 lg:sticky lg:top-6" aria-label="Knowledge Base"><DebassDocumentsPanel /></aside>}
      </div>
      {!embedded && <AssistantSettingsPrompt />}
    </div>
  );
}
