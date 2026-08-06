"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import DebsocOverlayScrollbar from "@/components/pairing/DebsocOverlayScrollbar";

export type SearchableDropdownItem = {
  id: string;
  label: string;
  value?: string;
  category?: string;
  description?: string;
  searchTerms?: readonly string[];
  icon?: ReactNode;
};

type SearchableDropdownProps = {
  emptyMessage: string;
  items: readonly SearchableDropdownItem[];
  label: string;
  placeholder: string;
  value?: string;
  onSelect?: (item: SearchableDropdownItem) => void;
  clearable?: boolean;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
};

type DropdownPosition = {
  left: number;
  maxHeight: number;
  placement: "above" | "below";
  top: number;
  width: number;
};

const VIEWPORT_PADDING = 8;
const MENU_GAP = 6;
const DEFAULT_MENU_HEIGHT = 288;

export default function SearchableDropdown({
  emptyMessage,
  items,
  label,
  placeholder,
  value,
  onSelect,
  clearable = false,
  onClear,
  disabled = false,
  className = "",
  searchable = true,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [internalValue, setInternalValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const selectedId = value ?? internalValue;
  const selectedItem = items.find((item) => item.id === selectedId);

  const filteredItems = useMemo(() => {
    if (!searchable) return [...items];
    const query = search.trim().toLowerCase();
    if (!query) return [...items];
    return items.filter((item) => [item.label, item.category, item.description, item.value, ...(item.searchTerms ?? [])]
      .filter(Boolean)
      .some((text) => text?.toLowerCase().includes(query)));
  }, [items, search, searchable]);
  const safeActiveIndex = Math.min(activeIndex, Math.max(filteredItems.length - 1, 0));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current &&
        !rootRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
        setSearch("");
        setPosition(null);
      }
    };
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeAndFocusTrigger();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    if (searchable) searchRef.current?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, searchable]);

  const measurePosition = useCallback((): DropdownPosition | null => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === "undefined") return null;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(
      Math.max(rect.width, 180),
      Math.max(viewportWidth - VIEWPORT_PADDING * 2, 0),
    );
    const left = Math.min(
      Math.max(rect.left, VIEWPORT_PADDING),
      Math.max(viewportWidth - VIEWPORT_PADDING - width, VIEWPORT_PADDING),
    );
    const availableAbove = Math.max(rect.top - VIEWPORT_PADDING - MENU_GAP, 0);
    const availableBelow = Math.max(viewportHeight - rect.bottom - VIEWPORT_PADDING - MENU_GAP, 0);
    const measuredHeight = menuRef.current?.scrollHeight || DEFAULT_MENU_HEIGHT;
    const opensAbove = availableBelow < measuredHeight && availableAbove > availableBelow;
    const availableHeight = opensAbove ? availableAbove : availableBelow;
    const maxHeight = Math.min(availableHeight, Math.max(viewportHeight - VIEWPORT_PADDING * 2, 0));
    const top = opensAbove
      ? Math.max(rect.top - MENU_GAP - maxHeight, VIEWPORT_PADDING)
      : Math.min(
          rect.bottom + MENU_GAP,
          Math.max(viewportHeight - VIEWPORT_PADDING - maxHeight, VIEWPORT_PADDING),
        );

    return { left, maxHeight, placement: opensAbove ? "above" : "below", top, width };
  }, []);

  const updatePosition = useCallback(() => {
    const nextPosition = measurePosition();
    if (nextPosition) setPosition(nextPosition);
  }, [measurePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(updatePosition);
    const onViewportChange = () => updatePosition();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open, search, filteredItems.length, updatePosition]);

  useEffect(() => {
    if (!open || !menuRef.current) return;
    const observer = new ResizeObserver(updatePosition);
    observer.observe(menuRef.current);
    return () => observer.disconnect();
  }, [open, updatePosition]);

  useEffect(() => {
    if (open) optionRefs.current[safeActiveIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, safeActiveIndex]);

  function closeAndFocusTrigger() {
    setOpen(false);
    setSearch("");
    setPosition(null);
    triggerRef.current?.focus();
  }

  function selectItem(item: SearchableDropdownItem) {
    setInternalValue(item.id);
    onSelect?.(item);
    closeAndFocusTrigger();
  }

  function clearSelection() {
    setInternalValue("");
    setSearch("");
    onClear?.();
    triggerRef.current?.focus();
  }

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(Math.max(items.findIndex((item) => item.id === selectedId), 0));
    setPosition(measurePosition());
  }

  function moveActive(direction: 1 | -1) {
    if (filteredItems.length === 0) return;
    setActiveIndex((index) => (index + direction + filteredItems.length) % filteredItems.length);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (open) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndFocusTrigger();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(event.key === "ArrowDown" ? 1 : -1);
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const item = filteredItems[safeActiveIndex];
        if (item) selectItem(item);
        return;
      }
    }
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openDropdown();
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocusTrigger();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(filteredItems.length - 1, 0));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const item = filteredItems[safeActiveIndex];
      if (item) selectItem(item);
    }
  }

  let previousCategory: string | undefined;
  const menuStyle: CSSProperties = position
    ? {
        left: position.left,
        maxHeight: position.maxHeight,
        top: position.top,
        width: position.width,
      }
    : {
        left: VIEWPORT_PADDING,
        maxHeight: DEFAULT_MENU_HEIGHT,
        top: VIEWPORT_PADDING,
        visibility: "hidden",
        width: typeof window === "undefined"
          ? 220
          : Math.min(
              triggerRef.current?.getBoundingClientRect().width ?? 220,
              window.innerWidth - VIEWPORT_PADDING * 2,
            ),
      };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${selectedItem?.label ?? placeholder}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={!searchable && open && filteredItems[safeActiveIndex] ? `${listId}-option-${filteredItems[safeActiveIndex].id}` : undefined}
        disabled={disabled}
        onClick={() => (open ? closeAndFocusTrigger() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:border-white/25 dark:focus-visible:border-indigo-400 ${clearable && selectedItem ? "pr-16" : ""} ${className}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedItem?.icon && <span aria-hidden>{selectedItem.icon}</span>}
          <span className={selectedItem ? "truncate" : "truncate text-slate-400 dark:text-slate-500"}>{selectedItem?.label ?? placeholder}</span>
        </span>
        <ChevronDown size={17} aria-hidden className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      {clearable && selectedItem && (
        <button
          type="button"
          aria-label={`Clear ${label}`}
          title={`Clear ${label}`}
          onClick={clearSelection}
          disabled={disabled}
          className="absolute right-8 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:text-slate-400 dark:hover:bg-white/10"
        >
          <X size={15} aria-hidden />
        </button>
      )}

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          data-placement={position?.placement ?? "below"}
          style={menuStyle}
          className={`fixed z-[200] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10 dark:border-white/15 dark:bg-[#171717] dark:shadow-black/40 ${position ? "" : "invisible"}`}
        >
          {searchable && <div className="border-b border-slate-200 p-2 dark:border-white/10">
            <div className="relative">
              <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setActiveIndex(0); }}
                onKeyDown={handleSearchKeyDown}
                role="combobox"
                aria-label={`${label} search`}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded={open}
                aria-activedescendant={filteredItems[safeActiveIndex] ? `${listId}-option-${filteredItems[safeActiveIndex].id}` : undefined}
                placeholder={placeholder}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
              />
              {search && <button type="button" aria-label="Clear search" title="Clear search" onClick={() => { setSearch(""); setActiveIndex(0); searchRef.current?.focus(); }} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:hover:bg-white/10"><X size={15} aria-hidden /></button>}
            </div>
          </div>}
          <DebsocOverlayScrollbar
            className="min-h-0"
            style={{ height: `${position ? Math.max(position.maxHeight - (searchable ? 58 : 8), 0) : DEFAULT_MENU_HEIGHT - (searchable ? 58 : 8)}px` }}
          >
          <div id={listId} role="listbox" aria-label={label} className="overscroll-contain p-1">
            {filteredItems.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
            ) : filteredItems.map((item, index) => {
              const showCategory = item.category && item.category !== previousCategory;
              previousCategory = item.category;
              return (
                <div key={item.id}>
                  {showCategory && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{item.category}</p>}
                  <button
                    id={`${listId}-option-${item.id}`}
                    ref={(element) => { optionRefs.current[index] = element; }}
                    type="button"
                    role="option"
                    aria-selected={selectedId === item.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectItem(item)}
                    className={`flex min-h-11 w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 motion-reduce:transition-none ${index === safeActiveIndex ? "bg-slate-100 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-white/[0.06]"}`}
                  >
                    <span className="mt-0.5 shrink-0 text-slate-600 dark:text-slate-300">{item.icon}</span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</span>{item.description && <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</span>}</span>
                    {selectedId === item.id && <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-300" />}
                  </button>
                </div>
              );
            })}
          </div>
          </DebsocOverlayScrollbar>
        </div>,
        document.body,
      )}
    </div>
  );
}
