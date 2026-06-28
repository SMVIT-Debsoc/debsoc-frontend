"use client";

import React from "react";
import type { LifecycleState } from "./mock";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-slate-200 rounded-lg ${className}`}>
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
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

export function StateBadge({ state }: { state: LifecycleState }) {
  const map: Record<LifecycleState, string> = {
    Preparation: "bg-slate-100 text-slate-700 border-slate-200",
    Generated: "bg-amber-50 text-amber-800 border-amber-200",
    Approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Published: "bg-blue-50 text-blue-800 border-blue-200",
    Active: "bg-indigo-50 text-indigo-800 border-indigo-200",
    Completed: "bg-violet-50 text-violet-800 border-violet-200",
    Scored: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${map[state]}`}
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
            i <= value ? "bg-blue-600" : "bg-slate-300"
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
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    emerald: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-800",
  } as const;
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded ${map[tone]}`}>
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
      className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium px-3 py-2 rounded-md ${className}`}
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
      className={`inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium px-3 py-2 rounded-md ${className}`}
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
      className={`inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium px-2 py-1.5 rounded-md ${className}`}
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
      <span className="block text-xs font-medium text-slate-700 mb-1">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}
