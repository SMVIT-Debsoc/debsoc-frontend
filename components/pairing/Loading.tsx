"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "./ui";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-lg bg-slate-200/75 motion-safe:animate-pulse dark:bg-white/[0.09] ${className}`}
    />
  );
}

export function LoadingRegion({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function InlineLoader({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-label={label}>
      <Loader2 size={15} className="motion-safe:animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function ButtonLoader({ label = "Working" }: { label?: string }) {
  return (
    <>
      <InlineLoader label={label} />
      <span>{label}…</span>
    </>
  );
}

export function CardSkeleton({ className = "", lines = 3 }: { className?: string; lines?: number }) {
  return (
    <Card className={`p-4 sm:p-5 ${className}`}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-8 w-20" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className={`h-3 ${index === lines - 1 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </Card>
  );
}

export function ListSkeleton({ count = 4, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/40 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ columns = 4, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10" aria-hidden="true">
      <div className="grid gap-4 bg-slate-100/70 p-3 dark:bg-white/[0.06]" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, index) => <Skeleton key={index} className="h-3 w-2/3" />)}
      </div>
      <div className="divide-y divide-slate-200 dark:divide-white/10">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }, (_, column) => <Skeleton key={column} className={`h-4 ${column === 0 ? "w-3/4" : "w-1/2"}`} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex items-start gap-3" aria-hidden="true">
      <Skeleton className="mt-1 h-8 w-8 shrink-0 rounded-xl" />
      <div className="w-full max-w-[min(90%,680px)] rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-5/6" />
        <Skeleton className="mt-2 h-3 w-2/3" />
      </div>
    </div>
  );
}

export function DocumentSkeleton({ count = 3 }: { count?: number }) {
  return (
    <LoadingRegion label="Loading research documents">
      <ListSkeleton count={count} />
    </LoadingRegion>
  );
}

export function FormSkeleton() {
  return (
    <LoadingRegion label="Loading form">
      <div className="space-y-5">
        {["w-28", "w-36", "w-24"].map((width, index) => (
          <div key={index}>
            <Skeleton className={`h-3 ${width}`} />
            <Skeleton className="mt-2 h-11 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    </LoadingRegion>
  );
}

export function ResultSkeleton({ label = "Preparing result" }: { label?: string }) {
  return (
    <LoadingRegion label={label} className="space-y-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-11/12" />
      <Skeleton className="h-3 w-3/4" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </LoadingRegion>
  );
}

export function PageSkeleton({ variant = "dashboard" }: { variant?: "dashboard" | "table" | "workspace" }) {
  if (variant === "table") {
    return <LoadingRegion label="Loading page"><TableSkeleton columns={4} rows={6} /></LoadingRegion>;
  }

  if (variant === "workspace") {
    return (
      <LoadingRegion label="Loading workspace" className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-3 w-72" /></div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
          <CardSkeleton className="min-h-[420px]" lines={6} />
          <CardSkeleton className="min-h-[420px]" lines={6} />
        </div>
      </LoadingRegion>
    );
  }

  return (
    <LoadingRegion label="Loading dashboard" className="space-y-5">
      <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-3 w-80" /></div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <CardSkeleton key={index} lines={1} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <CardSkeleton className="min-h-[260px]" lines={5} />
        <CardSkeleton className="min-h-[260px]" lines={5} />
      </div>
    </LoadingRegion>
  );
}
