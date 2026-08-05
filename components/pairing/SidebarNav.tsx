"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

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

const PRIMARY_KEYS = ["Home", "Digest", "Chat", "MockDrill", "MyPairing", "SpeakerLeaderboard"];
const PRIMARY_KEY_SET = new Set(PRIMARY_KEYS);

export default function SidebarNav({ entries, activeKey, collapsed, pillId, onSelect }: SidebarNavProps) {
  const primary = useMemo(() => PRIMARY_KEYS.map((key) => entries.find((entry) => entry.key === key)).filter((entry): entry is SidebarNavigationEntry => Boolean(entry)), [entries]);
  const more = useMemo(() => entries.filter((entry) => !PRIMARY_KEY_SET.has(entry.key)), [entries]);
  const sections = useMemo(() => buildMoreSections(more), [more]);

  return (
    <nav className="dashboard-nav flex min-w-0 flex-col gap-4" aria-label="Dashboard navigation">
      <div className="flex min-w-0 flex-col gap-1">
        {primary.map((entry) => (
          <SidebarNavItem key={entry.key} entry={entry} activeKey={activeKey} collapsed={collapsed} pillId={pillId} onSelect={onSelect} />
        ))}
      </div>
      {sections.length > 0 && (
        collapsed
          ? <SidebarMoreMenu key={activeKey} sections={sections} collapsed activeKey={activeKey} pillId={pillId} onSelect={onSelect} />
          : <InlineMoreSections sections={sections} activeKey={activeKey} pillId={pillId} onSelect={onSelect} />
      )}
    </nav>
  );
}

function InlineMoreSections({ sections, activeKey, pillId, onSelect }: { sections: SidebarNavigationSection[]; activeKey: string; pillId: string; onSelect: (key: string) => void }) {
  return (
    <div className="min-w-0 border-t border-slate-900/10 pt-3 dark:border-white/10">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">More</p>
      <div className="flex min-w-0 flex-col gap-3">
        {sections.map((section) => (
          <div key={section.key} className="flex min-w-0 flex-col gap-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{section.label}</p>
            {section.entries.map((entry) => (
              <SidebarNavItem key={entry.key} entry={entry} activeKey={activeKey} collapsed={false} pillId={pillId} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildMoreSections(entries: SidebarNavigationEntry[]): SidebarNavigationSection[] {
  const grouped = new Map<string, SidebarNavigationSection>([
    ["debate-tools", { key: "debate-tools", label: "Debate tools", entries: [] }],
    ["analytics", { key: "analytics", label: "Analytics & rankings", entries: [] }],
    ["sessions-scoring", { key: "sessions-scoring", label: "Sessions & scoring", entries: [] }],
    ["administration", { key: "administration", label: "Administration", entries: [] }],
  ]);

  for (const entry of entries) {
    const section = entry.key === "MockDrill" || entry.key === "MockJudge" || entry.key === "Spars"
      ? grouped.get("debate-tools")
      : entry.key.includes("Leaderboard")
        ? grouped.get("analytics")
        : entry.key === "MyScoring" || entry.key === "Sessions"
          ? grouped.get("sessions-scoring")
          : grouped.get("administration");
    section?.entries.push(entry);
  }

  return [...grouped.values()].filter((section) => section.entries.length > 0);
}

function SidebarNavItem({ entry, activeKey, collapsed, pillId, onSelect }: { entry: SidebarNavigationEntry; activeKey: string; collapsed: boolean; pillId: string; onSelect: (key: string) => void }) {
  const active = activeKey === entry.key;

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.key)}
      title={collapsed ? entry.label : undefined}
      aria-label={entry.label}
      aria-current={active ? "page" : undefined}
      className={`dashboard-nav-item relative flex min-h-[44px] min-w-0 touch-manipulation items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-2xl py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 ${active ? "bg-slate-900/[0.08] text-slate-950 ring-1 ring-slate-900/10 dark:bg-white/[0.10] dark:text-white dark:ring-white/10" : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"}`}
    >
      {active && <motion.span layoutId={pillId} className="absolute inset-0 rounded-2xl bg-transparent dark:bg-white/[0.04]" transition={{ type: "spring", duration: 0.45, bounce: 0.15 }} />}
      <span className={`dashboard-nav-content relative z-10 flex min-w-0 items-center ${collapsed ? "justify-center [&>svg]:h-[22px] [&>svg]:w-[22px]" : "gap-3"}`}>
        {entry.icon}
        {!collapsed && <span className="dashboard-nav-label min-w-0 truncate">{entry.label}</span>}
      </span>
    </button>
  );
}

function SidebarMoreMenu({ sections, collapsed, activeKey, pillId, onSelect }: { sections: SidebarNavigationSection[]; collapsed: boolean; activeKey: string; pillId: string; onSelect: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 300, maxHeight: 360 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const moreIsActive = sections.some((section) => section.entries.some((entry) => entry.key === activeKey));
  const items = useMemo(() => sections.flatMap((section) => section.entries), [sections]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, Math.max(180, window.innerWidth - 24));
    const viewportPadding = 12;
    const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - viewportPadding);
    const spaceAbove = Math.max(0, rect.top - viewportPadding);
    const desiredHeight = Math.min(420, Math.max(120, Math.max(spaceBelow, spaceAbove)));
    const openDownward = spaceBelow >= Math.min(desiredHeight, 240) || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(96, openDownward ? spaceBelow : spaceAbove);
    const top = openDownward
      ? Math.min(window.innerHeight - viewportPadding - maxHeight, rect.bottom + 8)
      : Math.max(viewportPadding, rect.top - maxHeight - 8);
    const leftOrigin = collapsed ? rect.right + 8 : rect.left;
    const left = Math.min(Math.max(viewportPadding, leftOrigin), window.innerWidth - width - viewportPadding);

    setPosition({ left, top, width, maxHeight });
  }, [collapsed]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    itemRefs.current[0]?.focus();

    const onResize = () => updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener("resize", onResize);
    document.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open, updatePosition]);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onOutsidePointerDown = (event: PointerEvent) => {
      if (triggerRef.current?.contains(event.target as Node) || panelRef.current?.contains(event.target as Node)) return;
      close();
    };
    document.addEventListener("pointerdown", onOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", onOutsidePointerDown);
  }, [close, open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    const currentIndex = itemRefs.current.findIndex((item) => item === document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + items.length) % items.length;
      itemRefs.current[nextIndex]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      itemRefs.current[event.key === "Home" ? 0 : items.length - 1]?.focus();
    }
  };

  const menu = open && typeof document !== "undefined" ? createPortal(
    <div
      ref={panelRef}
      role="menu"
      id={`${pillId}-more-menu`}
      aria-label="More dashboard destinations"
      onKeyDown={onMenuKeyDown}
      onPointerDown={(event) => event.stopPropagation()}
      style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
      className="fixed z-[90] overscroll-contain overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl shadow-slate-950/20 backdrop-blur-xl dark:border-white/10 dark:bg-[#171717]/95"
    >
      {sections.map((section) => (
        <div key={section.key} role="group" aria-label={section.label} className="mb-2 last:mb-0">
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{section.label}</p>
          {section.entries.map((entry) => {
            const itemIndex = items.findIndex((item) => item.key === entry.key);
            const active = activeKey === entry.key;
            return (
              <button
                key={entry.key}
                ref={(element) => { itemRefs.current[itemIndex] = element; }}
                type="button"
                role="menuitem"
                aria-current={active ? "page" : undefined}
                onClick={() => { onSelect(entry.key); close(); }}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${active ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-400/10 dark:text-indigo-200" : "text-slate-700 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/[0.08]"}`}
              >
                {entry.icon}
                <span className="min-w-0 truncate">{entry.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-controls={`${pillId}-more-menu`}
        aria-expanded={open}
        aria-label={moreIsActive ? "More dashboard destinations, current page is in More" : "More dashboard destinations"}
        title="More"
        onClick={() => setOpen((current) => !current)}
        className={`dashboard-nav-item relative flex min-h-[44px] min-w-0 touch-manipulation items-center rounded-2xl py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${moreIsActive || open ? "bg-slate-900/[0.08] text-slate-950 ring-1 ring-slate-900/10 dark:bg-white/[0.10] dark:text-white dark:ring-white/10" : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"}`}
      >
        {(moreIsActive || open) && <motion.span layoutId={pillId} className="absolute inset-0 rounded-2xl bg-transparent dark:bg-white/[0.04]" transition={{ type: "spring", duration: 0.45, bounce: 0.15 }} />}
        <span className={`relative z-10 flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <MoreHorizontal size={collapsed ? 22 : 18} aria-hidden="true" />
          {!collapsed && <><span className="min-w-0 flex-1 truncate">More</span><ChevronDown size={14} aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} /></>}
        </span>
      </button>
      {menu}
    </div>
  );
}
