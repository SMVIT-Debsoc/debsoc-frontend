"use client";

import { useMemo, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type SidebarNavigationEntry = {
  key: string;
  label: string;
  icon: ReactNode;
};

type SidebarNavigationSection = {
  key: string;
  label: string;
  entries: SidebarNavigationEntry[];
};

type SidebarNavProps = {
  entries: SidebarNavigationEntry[];
  activeKey: string;
  collapsed: boolean;
  pillId: string;
  onSelect: (key: string) => void;
};

const GROUP_ORDER = [
  { key: "overview", label: "Overview", entries: ["Home"] },
  { key: "learn", label: "Learn & Practice", entries: ["Chat", "MockDrill", "MockJudge", "Digest", "Spars"] },
  { key: "my-debate", label: "My Debate", entries: ["MyPairing", "MyScoring", "Sessions"] },
  { key: "society", label: "Run the Society", entries: ["Workspace", "Sessions", "Roster"] },
  { key: "rankings", label: "Rankings", entries: ["SpeakerLeaderboard", "AdjudicatorLeaderboard"] },
] as const;

const LABELS: Record<string, string> = {
  Chat: "Debate Assistant",
  Digest: "Debate Digest",
  Spars: "Spar Practice",
  SpeakerLeaderboard: "Speaker Rankings",
  AdjudicatorLeaderboard: "Adjudicator Rankings",
  MyScoring: "My Scoring",
  Roster: "Members & Cabinet",
};

function buildSections(entries: SidebarNavigationEntry[]) {
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  const isSocietyView = byKey.has("Workspace") || byKey.has("Roster");
  const sections: SidebarNavigationSection[] = [];

  for (const group of GROUP_ORDER) {
    const keys = group.key === "my-debate" && isSocietyView
      ? group.entries.filter((key) => key !== "Sessions")
      : group.key === "society" && !isSocietyView
        ? []
        : group.entries;
    const groupEntries = keys
      .map((key) => byKey.get(key))
      .filter((entry): entry is SidebarNavigationEntry => Boolean(entry));
    if (groupEntries.length > 0) {
      sections.push({ key: group.key, label: group.label, entries: groupEntries });
    }
  }

  const knownKeys = new Set(sections.flatMap((section) => section.entries.map((entry) => entry.key)));
  const remaining = entries.filter((entry) => !knownKeys.has(entry.key));
  if (remaining.length > 0) sections.push({ key: "other", label: "More", entries: remaining });
  return sections;
}

export default function SidebarNav({ entries, activeKey, collapsed, pillId, onSelect }: SidebarNavProps) {
  const sections = useMemo(() => buildSections(entries), [entries]);

  return (
    <nav className="dashboard-nav flex min-w-0 flex-col" aria-label="Dashboard navigation">
      {sections.map((section) => (
        <section key={section.key} className="dashboard-nav-section min-w-0" aria-labelledby={`${pillId}-${section.key}`}>
          {!collapsed && <h2 id={`${pillId}-${section.key}`} className="dashboard-nav-section-label truncate">{section.label}</h2>}
          <div className="flex min-w-0 flex-col gap-1">
            {section.entries.map((entry) => (
              <SidebarNavItem
                key={entry.key}
                entry={{ ...entry, label: LABELS[entry.key] ?? entry.label }}
                activeKey={activeKey}
                collapsed={collapsed}
                pillId={pillId}
                onSelect={onSelect}
                priority={entry.key === "Workspace"}
              />
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}

function SidebarNavItem({
  entry,
  activeKey,
  collapsed,
  pillId,
  onSelect,
  priority,
}: {
  entry: SidebarNavigationEntry;
  activeKey: string;
  collapsed: boolean;
  pillId: string;
  onSelect: (key: string) => void;
  priority: boolean;
}) {
  const active = activeKey === entry.key;
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.key)}
      title={collapsed ? entry.label : undefined}
      aria-label={entry.label}
      aria-current={active ? "page" : undefined}
      data-tooltip={collapsed ? entry.label : undefined}
      data-priority={priority ? "true" : undefined}
      className={`dashboard-nav-item relative flex min-h-11 min-w-0 touch-manipulation items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-2xl py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none ${active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
    >
      {active && <motion.span layoutId={pillId} className="absolute inset-0 rounded-2xl bg-transparent dark:bg-white/[0.04]" transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0.05 }} />}
      {active && <span className="absolute inset-y-2 left-0 z-10 w-[3px] rounded-full bg-sidebar-primary" aria-hidden="true" />}
      <span className={`dashboard-nav-content relative z-10 flex min-w-0 items-center ${collapsed ? "justify-center [&>svg]:h-6 [&>svg]:w-6" : "gap-3"}`}>
        {entry.icon}
        {!collapsed && <span className="dashboard-nav-label min-w-0 truncate">{entry.label}</span>}
      </span>
    </button>
  );
}
