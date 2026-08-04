"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { MouseEvent } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card, Pill, SectionHeader } from "./ui";

const linkButtonClass = "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm font-medium text-slate-800 backdrop-blur-sm transition hover:bg-black/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10";

export default function UnavailableWorkspace({
  icon: Icon,
  title,
  description,
  detail,
  status = "Unavailable",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  detail: string;
  status?: "Connected" | "Connecting" | "Disconnected" | "Unavailable";
}) {
  const statusTone = {
    Connected: "emerald",
    Connecting: "amber",
    Disconnected: "red",
    Unavailable: "slate",
  } as const;

  const navigate = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const url = new URL(href, window.location.href);
    window.history.pushState(null, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <SectionHeader
        title={title}
        subtitle="A focused workspace for debate preparation and research."
        right={
          <span className="inline-flex items-center gap-1.5" aria-label={`Debass service status: ${status}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === "Connected" ? "bg-emerald-500" : status === "Connecting" ? "bg-amber-500" : status === "Disconnected" ? "bg-red-500" : "bg-slate-400"}`} aria-hidden="true" />
            <Pill tone={statusTone[status]}>{status}</Pill>
          </span>
        }
      />
      <Card className="overflow-hidden p-6 sm:p-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-400/25 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Icon size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            {description}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            {detail}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard?tab=Home" onClick={navigate("/dashboard?tab=Home")} className={linkButtonClass}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back to home
            </Link>
            <Link href="/dashboard?tab=MyPairing" onClick={navigate("/dashboard?tab=MyPairing")} className={linkButtonClass}>
              View my pairing
              <ExternalLink size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
