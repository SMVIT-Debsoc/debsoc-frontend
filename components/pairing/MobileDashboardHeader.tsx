"use client";

import React from "react";
import { Menu } from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import ThemeToggle from "./ThemeToggle";

export default function MobileDashboardHeader({
  userName,
  fallbackName,
  brand,
  onMenu,
  menuButtonRef,
}: {
  userName: string;
  fallbackName: string;
  brand: string;
  onMenu: () => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <header className="dashboard-mobile-only glass-topbar sticky top-0 z-30 items-center justify-between gap-2 px-4 py-3 [padding-top:max(0.75rem,env(safe-area-inset-top))] text-foreground">
      <div className="-ml-1 flex min-w-0 items-center gap-2 font-semibold tracking-tight">
        <ProfileAvatar name={userName || fallbackName} className="h-8 w-8 shrink-0 shadow-sm shadow-indigo-600/30" initialsClassName="text-xs" />
        <span className="truncate">{brand}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <button ref={menuButtonRef} type="button" aria-label="Open dashboard menu" title="Open dashboard menu" aria-haspopup="dialog" onClick={onMenu} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
