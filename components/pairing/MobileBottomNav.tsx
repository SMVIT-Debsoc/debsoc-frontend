"use client";

import React from "react";

export default function MobileBottomNav({
  items,
  activeKey,
  onSelect,
}: {
  items: Array<{ key: string; label: string; icon: React.ReactNode }>;
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <nav className="dashboard-mobile-only mobile-bottom-nav glass-topbar fixed inset-x-0 bottom-0 z-30 items-stretch justify-around border-t border-slate-900/[0.06] px-1 dark:border-white/[0.06]" aria-label="Primary dashboard navigation">
      {items.map((item) => {
        const active = activeKey === item.key;
        return (
          <button key={item.key} type="button" onClick={() => onSelect(item.key)} aria-label={item.label} aria-current={active ? "page" : undefined} className={`flex min-h-11 min-w-11 touch-manipulation flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/70 motion-reduce:transition-none ${active ? "text-slate-950 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${active ? "bg-slate-900/10 ring-1 ring-slate-900/10 dark:bg-white/15 dark:ring-white/10" : ""}`}>{item.icon}</span>
            <span className="max-w-full truncate leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
