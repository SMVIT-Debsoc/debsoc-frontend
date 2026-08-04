"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, RefreshCw, Send, Sparkles, Trash2 } from "lucide-react";
import { getLocalChatFixture, LOCAL_CHAT_SUGGESTIONS } from "@/lib/dev/debass-mock/fixtures";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import DebassDocumentsPanel from "./DebassDocumentsPanel";
import { Card, PrimaryButton, SecondaryButton } from "./ui";
import { ChatMessageSkeleton } from "./Loading";
import { LocalMarkdown, LocalPreviewNotice, LocalSources, LocalWorkspaceHeader } from "./DebassWorkspaceUI";
import RealChatWorkspace from "./RealChatWorkspace";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

export default function ChatWorkspace({ developmentDebassMockEnabled = false, embedded = false }: { developmentDebassMockEnabled?: boolean; embedded?: boolean }) {
  if (!developmentDebassMockEnabled) {
    return <RealChatWorkspace embedded={embedded} />;
  }

  return <LocalChatWorkspace embedded={embedded} />;
}

function LocalChatWorkspace({ embedded = false }: { embedded?: boolean }) {
  const { assistantSessionVersion } = useDebassWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [typing, setTyping] = useState(false);
  const messageCounter = useRef(0);
  const responseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  useEffect(() => () => {
    responseTimers.current.forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      responseTimers.current.forEach((timer) => clearTimeout(timer));
      responseTimers.current = [];
      setMessages([]);
      setComposer("");
      setTyping(false);
      messageCounter.current = 0;
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [assistantSessionVersion]);

  const scheduleResponse = (prompt: string) => {
    setTyping(true);
    const timer = setTimeout(() => {
      const fixture = getLocalChatFixture(prompt);
      setMessages((current) => [
        ...current,
        {
          id: `chat-message-${messageCounter.current++}`,
          role: "assistant",
          content: fixture.content,
          citations: fixture.citations,
        },
      ]);
      setTyping(false);
    }, 650);
    responseTimers.current.push(timer);
  };

  const submitMessage = () => {
    const prompt = composer.trim();
    if (!prompt || typing) return;
    setMessages((current) => [
      ...current,
      { id: `chat-message-${messageCounter.current++}`, role: "user", content: prompt },
    ]);
    setComposer("");
    scheduleResponse(prompt);
  };

  const resetConversation = () => {
    responseTimers.current.forEach((timer) => clearTimeout(timer));
    responseTimers.current = [];
    setMessages([]);
    messageCounter.current = 0;
    setComposer("");
    setTyping(false);
    composerRef.current?.focus();
  };

  const retryLatestResponse = () => {
    if (typing) return;
    const latestUser = [...messages].reverse().find((message) => message.role === "user");
    if (!latestUser) return;
    const latestUserIndex = messages.findIndex((message) => message.id === latestUser.id);
    setMessages(messages.slice(0, latestUserIndex + 1));
    scheduleResponse(latestUser.content);
  };

  return (
    <div className={`flex w-full min-w-0 flex-col gap-4 ${embedded ? "min-h-[620px]" : "mx-auto min-h-[min(760px,calc(100dvh-7rem))] max-w-6xl"}`}>
      {!embedded && <LocalWorkspaceHeader title="DebSoc Debate Assistant" subtitle="A focused debate research workspace for questions, structure, and rebuttal practice." />}

      <div className={embedded ? "min-h-0 flex-1" : "grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.38fr)]"}>
      <Card className={`flex min-h-0 flex-col overflow-hidden p-0 ${embedded ? "" : "min-h-[min(720px,calc(100dvh-11rem))]"}`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
              <Sparkles size={17} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">DebSoc debate assistant</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">Development mock · no Debass connection</p>
            </div>
          </div>
          <SecondaryButton type="button" onClick={resetConversation} disabled={messages.length === 0 && !composer && !typing} className="shrink-0 px-3 text-xs">
            <Trash2 size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Clear</span>
          </SecondaryButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6" aria-busy={typing}>
          {messages.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-300">
                <MessageCircle size={26} aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Start with a debate question</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Use a suggestion or ask for a structure, rebuttal, or practice prompt.</p>
              <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
                {LOCAL_CHAT_SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => { setComposer(suggestion); composerRef.current?.focus(); }} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-indigo-400/40 dark:hover:bg-indigo-400/10">
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300"><Sparkles size={15} aria-hidden="true" /></div>}
                  <div className={`max-w-[min(90%,680px)] rounded-2xl px-4 py-3 ${message.role === "user" ? "rounded-br-md bg-slate-900 text-white dark:bg-white dark:text-slate-950" : "rounded-bl-md border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]"}`}>
                    {message.role === "assistant" ? <LocalMarkdown content={message.content} /> : <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>}
                    {message.role === "assistant" && message.citations && <LocalSources citations={message.citations} />}
                  </div>
                </div>
              ))}
              {typing && <div role="status" aria-live="polite"><ChatMessageSkeleton /><span className="sr-only">Local assistant is thinking</span></div>}
              <div ref={bottomRef} />
              {!typing && messages.some((message) => message.role === "assistant") && <div className="flex justify-center"><button type="button" onClick={retryLatestResponse} className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-medium text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"><RefreshCw size={13} aria-hidden="true" /> Retry latest preview</button></div>}
            </div>
          )}
          {messages.length === 0 && <div ref={bottomRef} />}
        </div>

        <div className="border-t border-slate-200 p-3 dark:border-white/10 sm:p-4">
          <div className="mx-auto max-w-3xl rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15 dark:border-white/15 dark:bg-white/[0.05]">
            <textarea ref={composerRef} value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitMessage(); } }} disabled={typing} rows={2} aria-label="Ask the local debate assistant" placeholder="Ask a debate question… (Enter to send, Shift+Enter for a new line)" className="min-h-14 w-full resize-none border-0 bg-transparent px-2 py-1 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-wait dark:text-slate-100 dark:placeholder:text-slate-500" />
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Local preview only</span>
              <PrimaryButton type="button" onClick={submitMessage} disabled={!composer.trim() || typing} className="min-h-9 px-3 text-xs"><Send size={14} aria-hidden="true" /> Send</PrimaryButton>
            </div>
          </div>
        </div>
      </Card>
      {!embedded && <aside className="min-w-0 lg:sticky lg:top-6" aria-label="Research Documents"><DebassDocumentsPanel /></aside>}
      </div>
      {!embedded && <LocalPreviewNotice>Responses and sources are deterministic local fixtures for development UI testing.</LocalPreviewNotice>}
    </div>
  );
}
