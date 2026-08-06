"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpenText, RefreshCw } from "lucide-react";
import { parseDigest } from "@/lib/digest/parse";
import { normalizeDigestResponse } from "@/lib/digest/response";
import { LoadingRegion, Skeleton } from "@/components/pairing/Loading";
import DigestCards from "./DigestCards";

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
  const [refreshing, setRefreshing] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  async function load() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const hasContent = state.status === "ready";
    if (hasContent) setRefreshing(true);
    else setState({ status: "loading" });

    try {
      const res = await fetch("/api/digest", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error("digest-request-failed");
      }
      const payload: unknown = await res.json();
      const data = normalizeDigestResponse(payload);
      if (!data) {
        throw new Error("digest-response-invalid");
      }
      if (!data.digest || !data.digest.text.trim()) {
        setState({ status: "empty" });
        return;
      }
      setState({
        status: "ready",
        text: data.digest.text,
        updatedAt: new Date(data.digest.updatedAt),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState({
        status: "error",
        message: "Couldn’t load today’s digest. Try again.",
      });
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setRefreshing(false);
      }
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect -- initial load synchronizes with the authenticated API after mount. */
  useEffect(() => {
    load();
    return () => requestRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (state.status === "loading") {
    return (
      <LoadingRegion label="Loading today’s digest" className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-3 w-44" />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card/70 p-5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-11/12" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </LoadingRegion>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 text-center">
        <p role="alert" className="text-sm text-destructive">{state.message}</p>
        <button
          type="button"
          onClick={load}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> Try again
        </button>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpenText className="h-7 w-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-foreground">
          Today&rsquo;s Digest is still being prepared.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {refreshing && (
        <p role="status" className="absolute right-4 top-4 z-10 inline-flex items-center rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm sm:right-6">
          Refreshing…
        </p>
      )}
      <DigestCards sections={parseDigest(state.text)} updatedAt={state.updatedAt} />
    </div>
  );
}
