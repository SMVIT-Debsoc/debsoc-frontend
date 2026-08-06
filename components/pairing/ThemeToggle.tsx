"use client";

import React, { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "debsoc-theme";
const CHANGE_EVENT = "debsoc-theme-change";

const OPTIONS: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
  { value: "light", label: "Light theme", icon: <Sun size={16} aria-hidden="true" /> },
  { value: "dark", label: "Dark theme", icon: <Moon size={16} aria-hidden="true" /> },
];

// Resolve the active theme: an explicit saved choice wins; otherwise mirror
// whatever the no-flash init script already applied (system preference).
function readTheme(): Theme {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// localStorage is the single source of truth; every toggle instance (sidebar,
// mobile top bar) and other tabs subscribe to the same store.
function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export default function ThemeToggle({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  const select = useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const activeIndex = OPTIONS.findIndex((option) => option.value === theme);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => select(theme === "dark" ? "light" : "dark")}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${className}`}
      >
        {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={`relative grid h-11 w-fit grid-cols-2 items-center rounded-full border border-border bg-muted p-1 ${className}`}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 left-1 w-[calc((100%-0.5rem)/2)] rounded-full bg-white shadow-sm transition-transform duration-200 [transition-timing-function:var(--ease-out-strong)] motion-reduce:transition-none dark:bg-white/15"
        style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)` }}
      />
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          aria-label={option.label}
          title={option.label}
          onClick={() => select(option.value)}
        className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          theme === option.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
