"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpenText } from "lucide-react";
import { parseDigest } from "@/lib/digest/parse";
import { normalizeDigestResponse } from "@/lib/digest/response";
import DigestCards from "./DigestCards";
import { DailyBriefTopBar } from "./DailyDebateBrief";
import DigestSkeleton from "./DigestSkeleton";

type DigestContent = {
  text: string;
  updatedAt: Date;
};

const DIGEST_LOAD_ERROR = "We couldn’t load today’s debate digest.";

/**
 * Client-side digest panel for embedding inside the dashboard. Reads the
 * role-gated GET /api/digest endpoint (session cookie is sent automatically)
 * and renders real parsed content, a stable editorial skeleton, or a safe
 * retryable error state.
 */
export default function DigestPanel() {
  const [content, setContent] = useState<DigestContent | null>(null);
  const [hasResolved, setHasResolved] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  async function load() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const hasContent = content !== null;

    if (hasContent) setRefreshing(true);
    else setInitialLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/digest", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("digest-request-failed");

      const payload: unknown = await res.json();
      const data = normalizeDigestResponse(payload);
      if (!data) throw new Error("digest-response-invalid");
      if (controller.signal.aborted || requestRef.current !== controller) return;

      if (!data.digest || !data.digest.text.trim()) {
        setContent(null);
        setHasResolved(true);
        return;
      }

      setContent({
        text: data.digest.text,
        updatedAt: new Date(data.digest.updatedAt),
      });
      setHasResolved(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (controller.signal.aborted || requestRef.current !== controller) return;
      setError(DIGEST_LOAD_ERROR);
      setHasResolved(true);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setInitialLoading(false);
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

  if (!content) {
    if (initialLoading || !hasResolved || error) {
      return <DigestSkeleton loading={initialLoading} error={error} onRetry={load} />;
    }

    return (
      <main className="mx-auto flex min-h-[42vh] w-full max-w-[1040px] flex-col items-center justify-center px-4 pb-16 text-center sm:px-6 lg:px-8">
        <div className="w-full"><DailyBriefTopBar date={null} refreshing={false} /></div>
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpenText className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-foreground">Today&rsquo;s Digest is still being prepared.</h1>
        <p className="mt-2 text-base leading-7 text-muted-foreground">Please check back later.</p>
      </main>
    );
  }

  return (
    <div className="relative" aria-busy={refreshing}>
      {(refreshing || error) && (
        <div className="absolute right-4 top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-end gap-2 sm:right-6">
          {refreshing && (
            <p role="status" aria-live="polite" className="inline-flex items-center rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              Refreshing…
            </p>
          )}
          {error && (
            <div role="alert" aria-live="polite" className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-card/95 px-3 py-1.5 text-xs font-medium text-destructive shadow-sm">
              <span>{error}</span>
              <button
                type="button"
                onClick={load}
                className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 font-semibold underline decoration-transparent underline-offset-2 transition hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
      <DigestCards sections={parseDigest(content.text)} updatedAt={content.updatedAt} refreshing={refreshing} />
    </div>
  );
}
