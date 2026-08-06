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
    <div className={`glass-card rounded-[24px] transition-[transform,box-shadow,border-color] ${className}`}>
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
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 sm:mb-5">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

export function StateBadge({ state }: { state: LifecycleState }) {
  const map: Record<LifecycleState, string> = {
    Preparation:
      "bg-muted text-muted-foreground border-border",
    Generated:
      "bg-chart-4/15 text-chart-4 border-chart-4/30",
    Approved:
      "bg-chart-3/15 text-chart-3 border-chart-3/30",
    Published:
      "bg-chart-2/15 text-chart-2 border-chart-2/30",
    Active:
      "bg-primary/15 text-primary border-primary/30",
    Completed:
      "bg-chart-4/15 text-chart-4 border-chart-4/30",
    Scored:
      "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm ${map[state]}`}
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
              ? "bg-primary"
              : "bg-muted-foreground/30"
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
    slate: "bg-muted text-muted-foreground",
    amber: "bg-chart-4/15 text-chart-4",
    blue: "bg-primary/15 text-primary",
    emerald: "bg-chart-3/15 text-chart-3",
    red: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs ${map[tone]}`}
    >
      {children}
    </span>
  );
}

type PrimaryButtonVariant = "default" | "success" | "danger";

export function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: PrimaryButtonVariant;
  }
) {
  const { className = "", variant = "default", ...rest } = props;
  const variants: Record<PrimaryButtonVariant, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    success: "bg-chart-3 text-primary-foreground hover:bg-chart-3/90",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };
  return (
    <button
      {...rest}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
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
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground backdrop-blur-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
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
      <span className="mb-1 block text-xs font-medium text-foreground">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-muted-foreground">
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
    <div className="rounded-2xl border border-dashed border-border bg-card/80 px-5 py-10 text-center backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-foreground">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
