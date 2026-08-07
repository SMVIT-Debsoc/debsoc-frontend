"use client";

import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/pairing/Loading";
import { DailyBriefTopBar } from "./DailyDebateBrief";

function SkeletonSurface({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-[24px] border border-border bg-card/75 p-5 shadow-sm sm:p-7 ${className}`}>{children}</div>;
}

function SkeletonLines({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-5 space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={`h-3 ${index === count - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function DigestHeroSkeleton() {
  return (
    <div className="border-b border-border py-10 sm:py-14" aria-hidden="true">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-5 h-10 w-[min(80%,32rem)] sm:h-14" />
      <Skeleton className="mt-4 h-5 w-[min(65%,24rem)]" />
      <Skeleton className="mt-8 h-20 w-full max-w-3xl rounded-2xl" />
    </div>
  );
}

export function DigestSectionSkeleton({ className = "" }: { className?: string }) {
  return (
    <SkeletonSurface className={className}>
      <div className="flex items-center gap-3" aria-hidden="true">
        <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
        <Skeleton className="h-5 w-44" />
      </div>
      <SkeletonLines />
    </SkeletonSurface>
  );
}

export function DigestArticleSkeleton() {
  return (
    <SkeletonSurface aria-hidden="true">
      <Skeleton className="h-3 w-36" />
      <Skeleton className="mt-3 h-3 w-24" />
      <div className="mt-7 max-w-[72ch] space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </SkeletonSurface>
  );
}

export function DigestDebateBuildSkeleton() {
  return (
    <SkeletonSurface aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {["w-32", "w-28"].map((width) => (
          <div key={width} className="space-y-3 border-t border-border pt-5">
            <Skeleton className={`h-3 ${width}`} />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </SkeletonSurface>
  );
}

export function DigestRebuttalSkeleton() {
  return (
    <SkeletonSurface aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="space-y-4 rounded-2xl border border-border p-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </SkeletonSurface>
  );
}

export function DigestVocabularySkeleton() {
  return (
    <SkeletonSurface aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
        <Skeleton className="h-5 w-44" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="rounded-2xl border border-border p-4">
            <Skeleton className="h-6 w-32" />
            <SkeletonLines count={3} />
          </div>
        ))}
      </div>
    </SkeletonSurface>
  );
}

function DigestRequestFeedback({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  if (!error) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert" aria-live="polite">
      <p className="text-sm font-medium text-destructive">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry
      </button>
    </div>
  );
}

export default function DigestSkeleton({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <main
      aria-busy={loading}
      aria-label={loading ? "Loading today’s debate digest" : "Today’s debate digest unavailable"}
      className="mx-auto w-full max-w-[1040px] px-4 pb-16 sm:px-6 lg:px-8"
    >
      <DailyBriefTopBar date={null} refreshing={false} />
      <div className="sr-only" role="status" aria-live="polite">
        {loading ? "Loading today’s debate digest…" : ""}
      </div>
      <DigestHeroSkeleton />
      <div className="mt-8 space-y-6 sm:mt-10 sm:space-y-8">
        <DigestRequestFeedback error={error} onRetry={onRetry} />
        <DigestSectionSkeleton />
        <DigestArticleSkeleton />
        <DigestDebateBuildSkeleton />
        <DigestSectionSkeleton />
        <DigestRebuttalSkeleton />
        <DigestSectionSkeleton />
        <DigestVocabularySkeleton />
        <DigestSectionSkeleton />
      </div>
    </main>
  );
}
