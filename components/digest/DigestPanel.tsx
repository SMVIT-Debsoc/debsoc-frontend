"use client";

import { useEffect, useState } from "react";
import { Inbox, Loader2, RefreshCw } from "lucide-react";
import { parseDigest } from "@/lib/digest/parse";
import DigestCards from "./DigestCards";

type DigestResponse = {
  digest: { text: string; updatedAt: string } | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ready"; text: string; updatedAt: Date };

/**
 * Client-side digest panel for embedding inside the dashboard. Reads the
 * role-gated GET /api/digest endpoint (session cookie is sent automatically)
 * and renders the parsed section cards, an empty state, or an error.
 */
export default function DigestPanel() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  async function load() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/digest", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const data = (await res.json()) as DigestResponse;
      if (!data.digest) {
        setState({ status: "empty" });
        return;
      }
      setState({
        status: "ready",
        text: data.digest.text,
        updatedAt: new Date(data.digest.updatedAt),
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to load digest.",
      });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
        Loading today&rsquo;s digest…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-rose-600 dark:text-rose-400">{state.message}</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> Try again
        </button>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          <Inbox className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-slate-900 dark:text-slate-50">
          No digest yet
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Today&rsquo;s debate digest hasn&rsquo;t arrived, or the last one has
          expired. Check back after the next weekday digest is published.
        </p>
      </div>
    );
  }

  return (
    <DigestCards sections={parseDigest(state.text)} updatedAt={state.updatedAt} />
  );
}
