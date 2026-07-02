"use client";

import React from "react";
import type { LifecycleState } from "./types";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-card rounded-2xl transition-shadow ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4 sm:mb-5">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

export function StateBadge({ state }: { state: LifecycleState }) {
  const map: Record<LifecycleState, string> = {
    Preparation:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10",
    Generated:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/25",
    Approved:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/25",
    Published:
      "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/25",
    Active:
      "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-300 dark:border-indigo-400/25",
    Completed:
      "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:border-violet-400/25",
    Scored:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10",
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${map[state]}`}
    >
      {state}
    </span>
  );
}

export function ConfidenceDots({ value }: { value: 0 | 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= value
              ? "bg-indigo-500 dark:bg-indigo-400"
              : "bg-slate-300 dark:bg-white/20"
          }`}
        />
      ))}
    </span>
  );
}

export function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "amber" | "blue" | "emerald" | "red";
}) {
  const map = {
    slate:
      "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    blue: "bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-300",
    emerald:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
    red: "bg-red-100 text-red-800 dark:bg-red-400/15 dark:text-red-300",
  } as const;
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-600/25 transition-colors hover:bg-indigo-500 active:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-white/10 dark:disabled:text-slate-500 ${className}`}
    />
  );
}

export function SecondaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/60 px-4 py-2 text-sm font-medium text-slate-800 backdrop-blur-sm transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10 ${className}`}
    />
  );
}

export function GhostButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex min-h-[36px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white ${className}`}
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {hint}
        </span>
      )}
    </label>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/40 px-5 py-10 text-center backdrop-blur-sm dark:border-white/15 dark:bg-white/[0.03]">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
        {body}
      </p>
    </div>
  );
}
