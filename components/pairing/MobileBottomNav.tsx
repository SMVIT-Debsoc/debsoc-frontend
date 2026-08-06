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
    <nav className="dashboard-mobile-only mobile-bottom-nav glass-topbar fixed inset-x-0 bottom-0 z-30 items-stretch justify-around border-t border-border px-1" aria-label="Primary dashboard navigation">
      {items.map((item) => {
        const active = activeKey === item.key;
        return (
          <button key={item.key} type="button" onClick={() => onSelect(item.key)} aria-label={item.label} title={item.label} aria-current={active ? "page" : undefined} className={`flex min-h-11 min-w-11 touch-manipulation flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-medium transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none ${active ? "text-foreground" : "text-muted-foreground"}`}>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors motion-reduce:transition-none ${active ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-border" : ""}`}>{item.icon}</span>
            <span className="max-w-full truncate leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
