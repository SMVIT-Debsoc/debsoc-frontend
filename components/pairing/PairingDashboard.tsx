"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";
import PairingBackdrop from "./PairingBackdrop";
import DebassWorkspaceProvider, { useDebassWorkspace } from "./DebassWorkspaceProvider";
import AssistantSettings from "./AssistantSettings";
import MobileBottomNav from "./MobileBottomNav";
import MobileDashboardHeader from "./MobileDashboardHeader";
import SidebarNav from "./SidebarNav";
import { InlineLoader, PageSkeleton } from "./Loading";
import { usePairingRealtime } from "./usePairingRealtime";
import AdminPairingDashboard, {
  ADMIN_TABS,
  type AdminTab,
} from "./AdminPairingDashboard";
import ParticipantPairingDashboard, {
  PARTICIPANT_TABS,
  type ParticipantTab,
} from "./ParticipantPairingDashboard";
import type {
  AdjudicatorLeaderboardRow,
  AttendanceHistoryItem,
  Participant,
  ProgressSummary,
  SessionRow,
  SpeakerLeaderboardRow,
} from "./types";
import type { RealtimeEventEnvelope, RealtimeSubscription } from "@/types/realtime";

type PairingDashboardProps = {
  role: string;
  userName: string;
  userId?: string | null;
  position?: string | null;
  embedded?: boolean;
};

type PairingDataState = {
  participants: Participant[];
  sparParticipants: Participant[];
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
  speakerLeaderboard: SpeakerLeaderboardRow[];
  speakerRounds: number;
  adjudicatorLeaderboard: AdjudicatorLeaderboardRow[];
  progressSummaries: ProgressSummary[];
  loading: boolean;
  loadingLeaderboard: boolean;
  error: string | null;
  leaderboardError: string | null;
  leaderboardScope: "all" | "bi-monthly";
};

const INITIAL_STATE: PairingDataState = {
  participants: [],
  sparParticipants: [],
  sessions: [],
  attendanceHistory: [],
  speakerLeaderboard: [],
  speakerRounds: 0,
  adjudicatorLeaderboard: [],
  progressSummaries: [],
  loading: true,
  loadingLeaderboard: true,
  error: null,
  leaderboardError: null,
  leaderboardScope: "all",
};

export default function PairingDashboard({
  role,
  userName,
  userId = null,
  position = null,
  embedded = false,
}: PairingDashboardProps) {
  const [state, setState] = useState<PairingDataState>(INITIAL_STATE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeMenuRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [adminTab, setAdminTab] = useState<AdminTab>("Home");
  const [participantTab, setParticipantTab] = useState<ParticipantTab>("Home");
  const isAdminView =
    role === "cabinet" || role === "President" || role === "TechHead";
  const navTabs = useMemo(
    () => (isAdminView ? ADMIN_TABS : PARTICIPANT_TABS),
    [isAdminView],
  );
  const activeTab = isAdminView ? adminTab : participantTab;
  useEffect(() => { setSidebarCollapsed(window.localStorage.getItem("debsoc-dashboard-sidebar") !== "expanded"); }, []);
  const toggleSidebar = () => setSidebarCollapsed((value) => { const next = !value; window.localStorage.setItem("debsoc-dashboard-sidebar", next ? "collapsed" : "expanded"); return next; });

  // Restore the active tab from the URL and listen for browser navigation so
  // Back/Forward changes the rendered workspace as well as the address bar.
  useEffect(() => {
    const syncTabFromLocation = () => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (isAdminView && tab && ADMIN_TABS.some((entry) => entry.key === tab)) {
        setAdminTab(tab as AdminTab);
      } else if (!isAdminView && tab && PARTICIPANT_TABS.some((entry) => entry.key === tab)) {
        setParticipantTab(tab as ParticipantTab);
      } else if (isAdminView) {
        setAdminTab("Home");
      } else {
        setParticipantTab("Home");
      }
    };

    syncTabFromLocation();
    window.addEventListener("popstate", syncTabFromLocation);
    return () => window.removeEventListener("popstate", syncTabFromLocation);
  }, [isAdminView]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") === activeTab) return;
    url.searchParams.set("tab", activeTab);
    window.history.replaceState(null, "", url);
  }, [activeTab]);

  const [primaryDataVersion, setPrimaryDataVersion] = useState(0);
  const refreshPrimaryData = () => setPrimaryDataVersion((v) => v + 1);
  const [leaderboardDataVersion, setLeaderboardDataVersion] = useState(0);
  const refreshLeaderboardData = () => setLeaderboardDataVersion((v) => v + 1);
  const initialDataLoading = state.loading && primaryDataVersion === 0;
  const initialLeaderboardLoading = state.loadingLeaderboard && leaderboardDataVersion === 0;
  const [workspaceRealtimeEvent, setWorkspaceRealtimeEvent] = useState<RealtimeEventEnvelope | null>(null);
  const primaryRefreshTimeoutRef = useRef<number | null>(null);
  const leaderboardRefreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPrimaryData() {
      const isInitial = primaryDataVersion === 0;
      if (isInitial) {
        setState((current) => ({ ...current, loading: true, error: null }));
      }

      try {
        const data = await fetchPrimaryData(role);
        if (cancelled) return;
        setState((current) => ({
          ...current,
          ...data,
          loading: false,
          error: null,
        }));
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load pairing data.",
        }));
      }
    }

    loadPrimaryData();

    return () => {
      cancelled = true;
    };
  }, [role, primaryDataVersion]);

  // Keep lightweight overview surfaces live, but avoid interrupting tabs where
  // people are actively filling forms, reviewing pairings, or working in a
  // modal-heavy flow. Home stays on the faster cadence because it is the
  // discovery surface for newly relevant session state.
  useEffect(() => {
    const liveRefreshTabs = new Set<string>([
      "Home",
      "SpeakerLeaderboard",
      "AdjudicatorLeaderboard",
    ]);
    if (!liveRefreshTabs.has(activeTab)) {
      return;
    }
    const onFocus = () => {
      if (document.visibilityState === "visible") refreshPrimaryData();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const refreshIntervalMs = activeTab === "Home" ? 10_000 : 30_000;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshPrimaryData();
    }, refreshIntervalMs);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.clearInterval(interval);
    };
  }, [activeTab, isAdminView]);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setState((current) => ({
        ...current,
        loadingLeaderboard: true,
        leaderboardError: null,
      }));

      try {
        const leaderboard = await fetchLeaderboards(state.leaderboardScope);
        if (cancelled) return;
        setState((current) => ({
          ...current,
          ...leaderboard,
          loadingLeaderboard: false,
          leaderboardError: null,
        }));
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          speakerLeaderboard: [],
          speakerRounds: 0,
          adjudicatorLeaderboard: [],
          loadingLeaderboard: false,
          leaderboardError:
            error instanceof Error ? error.message : "Failed to load leaderboard.",
        }));
      }
    }

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [leaderboardDataVersion, state.leaderboardScope]);

  const realtimeRelevantSessions = useMemo(
    () =>
      state.sessions.filter(
        (session) => session.state !== "Completed" && session.state !== "Scored",
      ),
    [state.sessions],
  );

  const realtimeSubscriptions = useMemo(() => {
    const sessionIds = [...new Set(realtimeRelevantSessions.map((session) => session.id).filter(Boolean))];
    const subscriptions: RealtimeSubscription[] = [{ scope: "LEADERBOARD" }, { scope: "DASHBOARD" }];

    for (const sessionId of sessionIds) {
      if (isAdminView) {
        subscriptions.push({ scope: "SESSION_ADMIN", sessionId });
      }

      if (role !== "TechHead") {
        subscriptions.push({ scope: "SESSION_PUBLISHED", sessionId });
      }

      subscriptions.push({ scope: "SESSION_SCORING", sessionId });
    }

    return subscriptions;
  }, [isAdminView, realtimeRelevantSessions, role]);

  const schedulePrimaryRefresh = () => {
    if (primaryRefreshTimeoutRef.current !== null) {
      return;
    }

    primaryRefreshTimeoutRef.current = window.setTimeout(() => {
      primaryRefreshTimeoutRef.current = null;
      refreshPrimaryData();
    }, 0);
  };

  const scheduleLeaderboardRefresh = () => {
    if (leaderboardRefreshTimeoutRef.current !== null) {
      return;
    }

    leaderboardRefreshTimeoutRef.current = window.setTimeout(() => {
      leaderboardRefreshTimeoutRef.current = null;
      refreshLeaderboardData();
    }, 0);
  };

  useEffect(() => {
    return () => {
      if (primaryRefreshTimeoutRef.current !== null) {
        window.clearTimeout(primaryRefreshTimeoutRef.current);
      }
      if (leaderboardRefreshTimeoutRef.current !== null) {
        window.clearTimeout(leaderboardRefreshTimeoutRef.current);
      }
    };
  }, []);

  usePairingRealtime({
    enabled: true,
    // Admin surfaces use the lower-latency WebSocket transport; other views
    // stay on SSE. Both terminate in the same realtime hub server-side.
    transport: isAdminView ? "ws" : "sse",
    subscriptions: realtimeSubscriptions,
    onBootstrap() {
      schedulePrimaryRefresh();
      scheduleLeaderboardRefresh();
    },
    onEvent(event) {
      setWorkspaceRealtimeEvent(event);
      if (event.refetchHints.includes("leaderboard")) {
        scheduleLeaderboardRefresh();
      }

      if (
        event.refetchHints.includes("session_detail") ||
        event.refetchHints.includes("published_pairing") ||
        event.refetchHints.includes("scoring_status") ||
        event.refetchHints.includes("dashboard")
      ) {
        schedulePrimaryRefresh();
      }
    },
  });

  const applyTab = (key: string) => {
    if (isAdminView) {
      setAdminTab(key as AdminTab);
    } else {
      setParticipantTab(key as ParticipantTab);
    }
    // Keep My Pairing stable while someone is viewing it; only overview/task
    // surfaces force an immediate refetch on entry.
    if (key === "MyScoring" || key === "Home" || key === "MyPairing") {
      refreshPrimaryData();
    }
  };

  const navigateToTab = (key: string) => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== key) {
      url.searchParams.set("tab", key);
      window.history.pushState(null, "", url);
    }
    applyTab(key);
  };

  // Desktop sidebar / mobile bottom bar: no drawer to animate, switch at once.
  const selectTab = (key: string) => {
    navigateToTab(key);
    setSidebarOpen(false);
  };

  // Mobile drawer: close first, then switch the page once the slide-out finishes
  // (applied in the drawer's AnimatePresence onExitComplete) so the drawer glides
  // away before the new surface appears, matching the desktop transition feel.
  const selectTabFromDrawer = (key: string) => {
    setPendingTab(key);
    setSidebarOpen(false);
  };

  const navGroups = useMemo(() => {
    const primaryKeys = new Set(["Home", "Chat", "MyPairing", "SpeakerLeaderboard"]);
    return [
      {
        key: "primary",
        label: "Your workspace",
        entries: navTabs.filter((entry) => primaryKeys.has(entry.key)),
      },
      {
        key: "secondary",
        label: isAdminView ? "Administration" : "More",
        entries: navTabs.filter((entry) => !primaryKeys.has(entry.key)),
      },
    ].filter((group) => group.entries.length > 0);
  }, [isAdminView, navTabs]);

  // The bottom bar stays focused on the four primary destinations. Secondary
  // and role-specific options remain in the drawer and desktop sidebar.
  const primaryTabs = useMemo(() => {
    const primaryKeys = ["Home", "Chat", "MyPairing", "SpeakerLeaderboard"];
    return primaryKeys
      .map((key) => navTabs.find((tab) => tab.key === key))
      .filter((tab): tab is (typeof navTabs)[number] => Boolean(tab))
      .map((tab) => ({
        ...tab,
        label: tab.key === "Chat" ? "Chat" : tab.key === "MyPairing" ? "Pairing" : tab.key === "SpeakerLeaderboard" ? "Ranks" : "Home",
      }));
  }, [navTabs]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    const focusFrame = window.requestAnimationFrame(() => closeMenuRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSidebarOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current || !drawerRef.current.contains(document.activeElement)) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => {
        if (menuButton && document.contains(menuButton)) {
          menuButton.focus();
        }
      });
    };
  }, [sidebarOpen]);

  const renderNav = (pillId: string, onSelect: (key: string) => void = selectTab, collapsed = false) => (
    <nav className="dashboard-nav flex min-w-0 flex-col gap-4" aria-label="Dashboard navigation">
      {navGroups.map((group) => (
        <div key={group.key} className="flex flex-col gap-1">
          {!collapsed && <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{group.label}</p>}
          {group.entries.map((entry) => {
        const isActive = activeTab === entry.key;
        return (
          <button
            key={entry.key}
            type="button"
            onClick={() => onSelect(entry.key)}
            title={collapsed ? entry.label : undefined}
            aria-label={entry.label}
            aria-current={isActive ? "page" : undefined}
            className={`dashboard-nav-item relative flex min-h-[44px] items-center ${collapsed ? "justify-center px-2" : "gap-3 px-3"} rounded-2xl py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 ${
              isActive
                ? "text-slate-950 bg-slate-900/[0.08] ring-1 ring-slate-900/10 dark:text-white dark:bg-white/[0.10] dark:ring-white/10"
                : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-2xl bg-transparent dark:bg-white/[0.04]"
                transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
              />
            )}
            <span
              className={`dashboard-nav-content relative z-10 flex items-center gap-3 ${
                collapsed ? "[&>svg]:h-[22px] [&>svg]:w-[22px]" : ""
              }`}
            >
              {entry.icon}
              {!collapsed && <span>{entry.label}</span>}
            </span>
          </button>
        );
          })}
        </div>
      ))}
    </nav>
  );

  const openLeaderboards = () => {
    navigateToTab("SpeakerLeaderboard");
  };

  const openAdjudicatorLeaderboards = () => {
    navigateToTab("AdjudicatorLeaderboard");
  };

  const dashboardContent = isAdminView ? (
    <AdminPairingDashboard
      role={role}
      userName={userName}
      userId={userId}
      position={position}
      participants={state.participants}
      sparParticipants={state.sparParticipants}
      sessions={state.sessions}
      onSessionsChange={(sessions) =>
        setState((current) => ({ ...current, sessions }))
      }
      attendanceHistory={state.attendanceHistory}
      speakerLeaderboard={state.speakerLeaderboard}
      speakerRounds={state.speakerRounds}
      adjudicatorLeaderboard={state.adjudicatorLeaderboard}
      progressSummaries={state.progressSummaries}
      leaderboardScope={state.leaderboardScope}
      loading={initialDataLoading}
      loadingLeaderboard={initialLeaderboardLoading}
      error={state.error}
      leaderboardError={state.leaderboardError}
      onLeaderboardScopeChange={(scope) =>
        setState((current) => ({ ...current, leaderboardScope: scope }))
      }
      onOpenWorkspace={() => navigateToTab("Workspace")}
      onOpenLeaderboards={openLeaderboards}
      onOpenAdjudicatorLeaderboards={openAdjudicatorLeaderboards}
      onOpenChat={() => navigateToTab("Chat")}
      onOpenMockDrill={() => navigateToTab("MockDrill")}
      onOpenMockJudge={() => navigateToTab("MockJudge")}
      onRefresh={refreshPrimaryData}
      workspaceRealtimeEvent={workspaceRealtimeEvent}
      activeTab={adminTab}
    />
  ) : (
    <ParticipantPairingDashboard
      role={role}
      userName={userName}
      userId={userId}
      position={position}
      sessions={state.sessions}
      attendanceHistory={state.attendanceHistory}
      participants={state.participants}
      sparParticipants={state.sparParticipants}
      speakerLeaderboard={state.speakerLeaderboard}
      speakerRounds={state.speakerRounds}
      adjudicatorLeaderboard={state.adjudicatorLeaderboard}
      leaderboardScope={state.leaderboardScope}
      loading={initialDataLoading}
      loadingLeaderboard={initialLeaderboardLoading}
      error={state.error}
      leaderboardError={state.leaderboardError}
      onLeaderboardScopeChange={(scope) =>
        setState((current) => ({ ...current, leaderboardScope: scope }))
      }
      onOpenLeaderboards={openLeaderboards}
      onOpenAdjudicatorLeaderboards={openAdjudicatorLeaderboards}
      onOpenChat={() => navigateToTab("Chat")}
      onOpenMockDrill={() => navigateToTab("MockDrill")}
      onOpenMockJudge={() => navigateToTab("MockJudge")}
      onRefresh={refreshPrimaryData}
      activeTab={participantTab}
    />
  );

  const content = initialDataLoading ? (
    <PageSkeleton
      variant={activeTab === "Workspace" ? "workspace" : activeTab === "Sessions" || activeTab === "Roster" || activeTab.includes("Leaderboard") ? "table" : "dashboard"}
    />
  ) : dashboardContent;

  const contentRef = useRef<HTMLElement | null>(null);

  // Replay the content entrance on tab change without remounting the tab
  // subtree (remounting would drop in-tab state like the selected session).
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    element.classList.remove("content-enter");
    void element.offsetWidth;
    element.classList.add("content-enter");
  }, [activeTab]);

  if (embedded) {
    return content;
  }

  const firstName = (userName?.trim().split(/\s+/)[0]) || (
    role === "President" ? "President"
    : role === "cabinet" ? (position?.trim() || "Cabinet")
    : role === "TechHead" ? "Tech Head"
    : "Member"
  );
  const brand = `${firstName}'s Dashboard`;

  return (
    <DebassWorkspaceProvider>
      <div className="pairing-shell dashboard-desktop-shell relative min-h-screen min-w-0 overflow-x-clip text-slate-900 dark:text-slate-100" data-density={role === "cabinet" || role === "President" ? "compact" : "comfortable"}>
      <PairingBackdrop />
      {/* Mobile top bar */}
      <MobileDashboardHeader userName={userName} fallbackName={firstName} brand={brand} onMenu={() => setSidebarOpen(true)} menuButtonRef={menuButtonRef} />

      {/* Desktop sidebar */}
      <aside data-collapsed={sidebarCollapsed ? "true" : "false"} className={`dashboard-desktop-sidebar glass-sidebar relative z-10 flex min-h-0 shrink-0 flex-col p-4 transition-[width] duration-300 sticky top-4 my-4 ml-4 h-[calc(100dvh-2rem)] rounded-[28px] ${sidebarCollapsed ? "w-[88px]" : "w-80"}`}>
        <header className={`dashboard-sidebar-header mb-5 flex w-full shrink-0 font-semibold tracking-tight text-slate-900 dark:text-white ${sidebarCollapsed ? "flex-col items-center gap-3" : "min-h-11 items-center gap-2.5"}`}>
          <div className={`flex min-w-0 items-center gap-2.5 ${sidebarCollapsed ? "w-full justify-center" : "flex-1"}`}>
            <ProfileAvatar name={userName || firstName} className="h-9 w-9 shrink-0 shadow-sm shadow-indigo-600/30" initialsClassName="text-sm" />
            {!sidebarCollapsed && <div className="dashboard-profile-details min-w-0"><span className="block truncate">{userName || firstName}</span><span className="block truncate text-[11px] font-normal text-slate-500">{position || role} · Dashboard</span></div>}
          </div>
          <button type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className={`inline-flex shrink-0 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-slate-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:text-slate-200 dark:hover:bg-white/10 ${sidebarCollapsed ? "min-h-[60px] w-full" : "h-11 w-11"}`}>
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white dark:border-white/15 dark:bg-[#171717]/95 dark:hover:bg-[#252525]">
              {sidebarCollapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
            </span>
          </button>
        </header>
        <div className="dashboard-sidebar-navigation min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
          <SidebarNav entries={navTabs} activeKey={activeTab} collapsed={sidebarCollapsed} pillId="pairing-nav-pill-desktop" onSelect={selectTab} />
        </div>
        <footer className={`dashboard-sidebar-footer mt-5 flex shrink-0 flex-col gap-2 border-t border-black/10 pt-5 dark:border-white/10 ${sidebarCollapsed ? "items-center" : "items-stretch"}`}>
          {!sidebarCollapsed ? <div className="flex items-center gap-2"><ThemeToggle /><AssistantSettings /></div> : <AssistantSettings collapsed />}
          <div className={sidebarCollapsed ? "flex w-full justify-center" : "w-full"}>
            <LogoutButton collapsed={sidebarCollapsed} />
          </div>
        </footer>
      </aside>

      {/* Mobile off-canvas drawer */}
      <AnimatePresence
        onExitComplete={() => {
          if (pendingTab) {
            navigateToTab(pendingTab);
            setPendingTab(null);
          }
        }}
      >
        {sidebarOpen && (
          <div className="dashboard-mobile-only">
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard menu"
              className="glass-drawer fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col p-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] [padding-top:max(1rem,env(safe-area-inset-top))]"
              initial={{ transform: "translateX(-100%)" }}
              animate={{ transform: "translateX(0%)" }}
              exit={{ transform: "translateX(-100%)" }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.08 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900 dark:text-white">
                  <ProfileAvatar name={userName || firstName} className="h-9 w-9 shadow-sm shadow-indigo-600/30" initialsClassName="text-sm" />
                  <span>{brand}</span>
                </div>
                <button
                  ref={closeMenuRef}
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-900/5 dark:hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {renderNav("pairing-nav-pill-drawer", selectTabFromDrawer)}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-slate-900/[0.06] pt-4 dark:border-white/[0.06]">
                <AssistantSettings />
                <div className="[&>button]:w-full flex-1">
                  <LogoutButton />
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main
        ref={contentRef}
        className="pairing-main content-enter relative z-10 min-h-0 min-w-0 flex-1 p-4 sm:p-6"
      >
        {!initialDataLoading && (state.loading || state.loadingLeaderboard) && (
          <div className="mb-4 flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
            <InlineLoader label="Refreshing dashboard data" />
            <span>Refreshing live data</span>
          </div>
        )}
        {content}
      </main>

      <MobileBottomNav items={primaryTabs} activeKey={activeTab} onSelect={selectTab} />
      </div>
    </DebassWorkspaceProvider>
  );
}

function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const { clearKey, clearAssistantSession } = useDebassWorkspace();

  return (
    <button
      type="button"
      aria-label="Log out"
      onClick={() => {
        clearKey();
        clearAssistantSession();
        void signOut({ callbackUrl: "/" });
      }}
      title="Log out"
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border border-red-600/25 bg-red-500/[0.08] px-4 text-sm font-semibold text-red-700 backdrop-blur-md transition hover:bg-red-500/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 dark:border-red-300/25 dark:bg-red-500/[0.12] dark:text-red-200 dark:hover:bg-red-500/[0.20] ${collapsed ? "h-11 w-11 shrink-0 px-0" : "w-full flex-1"}`}
    >
      <LogOut size={16} />
      {!collapsed && <span className="dashboard-logout-label">Logout</span>}
    </button>
  );
}

async function fetchPrimaryData(role: string) {
  if (role === "cabinet" || role === "President" || role === "TechHead") {
    const [bootstrap, attendance, progress, sparRoster] = await Promise.all([
      fetchJson<{
        members: ApiMember[];
        cabinet: ApiCabinet[];
        presidents?: ApiPresident[];
        sessions: ApiAdminSession[];
      }>("/api/pairing/bootstrap"),
      fetchJson<{ attendance: ApiAttendanceHistory[] }>("/api/pairing/attendance/self"),
      role === "TechHead"
        ? Promise.resolve({ participants: [] as ApiProgressSummary[] })
        : fetchJson<{ participants: ApiProgressSummary[] }>("/api/progress/members"),
      role === "TechHead"
        ? Promise.resolve(null)
        : fetchJson<{
            members: ApiMember[];
            cabinet: ApiCabinet[];
            presidents?: ApiPresident[];
          }>("/api/spar/participants"),
    ]);
    const participants = normalizeParticipants(bootstrap);

    return {
      participants,
      sparParticipants: sparRoster ? normalizeParticipants(sparRoster) : participants,
      sessions: bootstrap.sessions.map(normalizeAdminSession),
      attendanceHistory: (attendance.attendance ?? []).map(normalizeAttendanceHistory),
      progressSummaries: (progress.participants ?? []).map(normalizeProgressSummary),
    };
  }

  const [attendance, sparRoster] = await Promise.all([
    fetchJson<{
      attendance: ApiAttendanceHistory[];
      publishedSessions?: ApiParticipantSession[];
    }>("/api/pairing/attendance/self"),
    fetchJson<{
      members: ApiMember[];
      cabinet: ApiCabinet[];
      presidents?: ApiPresident[];
    }>("/api/spar/participants"),
  ]);
  const attendanceHistory = (attendance.attendance ?? []).map(normalizeAttendanceHistory);

  return {
    participants: normalizeParticipants(sparRoster),
    sparParticipants: normalizeParticipants(sparRoster),
    sessions: mergeParticipantSessions(
      deriveSessionsFromAttendance(attendanceHistory),
      (attendance.publishedSessions ?? []).map(normalizeParticipantSession),
    ),
    attendanceHistory,
    progressSummaries: [],
  };
}

async function fetchLeaderboards(scope: "all" | "bi-monthly") {
  const suffix = scope === "bi-monthly" ? "?type=bi-monthly" : "";
  const [speakerData, adjudicatorData] = await Promise.all([
    fetchJson<{ leaderboard: ApiSpeakerLeaderboardEntry[]; roundsCount?: number }>(
      `/api/leaderboard/speakers${suffix}`,
    ),
    fetchJson<{ leaderboard: ApiAdjudicatorLeaderboardEntry[] }>(
      `/api/leaderboard/adjudicators${suffix}`,
    ),
  ]);

  return {
    speakerLeaderboard: (speakerData.leaderboard ?? []).map((entry) => ({
      id: entry.participantId,
      name: entry.name,
      type: "Participant",
      score: entry.score,
      sessions: entry.sessionsCount,
      rank: entry.rank,
    })),
    speakerRounds: speakerData.roundsCount ?? 0,
    adjudicatorLeaderboard: (adjudicatorData.leaderboard ?? []).map((entry) => ({
      id: entry.participantId,
      name: entry.name,
      type: "Participant",
      score: entry.score,
      sessions: entry.sessionsCount,
      chairedCount: entry.chairedCount,
      adjudicatedCount: entry.adjudicatedCount,
      rank: entry.rank,
    })),
  };
}

// Ceiling for a single dashboard read. The bootstrap read is a large composite
// query and the backing DB (Neon serverless) can cold-start after idle, so a
// tight budget spuriously aborts the first load; a warm request still returns
// in well under this, so the ceiling only bites on a genuine cold start.
const FETCH_TIMEOUT_MS = 30000;

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const fallback = `Request failed for ${url} (HTTP ${response.status})`;
      throw new Error(await readApiError(response, fallback, response.status));
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timed out for ${url}`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function readApiError(response: Response, fallback: string, status: number) {
  try {
    const data = (await response.json()) as { message?: string };
    if (data.message && data.message.trim()) {
      return process.env.NODE_ENV === "development" ? `${data.message} (HTTP ${status})` : data.message;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function normalizeParticipants(roster: {
  members: ApiMember[];
  cabinet: ApiCabinet[];
  presidents?: ApiPresident[];
}): Participant[] {
  return [
    ...(roster.members ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      account: "Member" as const,
      isVerified: member.isVerified,
    })),
    ...(roster.cabinet ?? []).map((cabinet) => ({
      id: cabinet.id,
      name: cabinet.name,
      email: cabinet.email,
      account: "Cabinet" as const,
      position: cabinet.position,
      isVerified: cabinet.isVerified,
    })),
    ...((roster.presidents ?? []).map((president) => ({
      id: president.id,
      name: president.name,
      email: president.email,
      account: "President" as const,
      isVerified: president.isVerified,
    })) ?? []),
  ].sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeAdminSession(session: ApiAdminSession): SessionRow {
  return {
    id: session.id,
    date: formatDate(session.sessionDate),
    motionType: session.motionType ?? session.motiontype,
    motionText: session.motionText ?? undefined,
    chair: session.Chair,
    assignedChairLabel: deriveAssignedChairLabel(session),
    participantAssignmentLabels: deriveParticipantAssignmentLabels(session),
    state: deriveLifecycleState(session),
    attendance: session.attendance ?? [],
  };
}

function normalizeAttendanceHistory(item: ApiAttendanceHistory): AttendanceHistoryItem {
  const participantIds = [item.memberId, item.cabinetId, item.presidentId].filter(
    (id): id is string => Boolean(id),
  );
  return {
    id: item.id,
    participantId: item.memberId ?? item.cabinetId ?? item.presidentId ?? undefined,
    participantIds,
    status: item.status,
    speakerScore: item.speakerScore ?? null,
    pairingCode: item.pairingCode ?? null,
    debatedAlone: Boolean(item.debatedAlone),
    pairedWith: item.pairedWith ?? [],
    assignmentLabel: item.assignmentLabel ?? null,
    session: {
      id: item.session.id,
      sessionDate: formatDate(item.session.sessionDate),
      motiontype: item.session.motionType ?? item.session.motiontype,
      Chair: item.session.Chair,
    },
  };
}

function deriveAssignedChairLabel(session: ApiAdminSession) {
  const proposal = session.publishedProposal ?? session.acceptedProposal;
  const chairNames = proposal?.roomAssignments
    .flatMap((room) => room.adjudicatorAssignments)
    .filter((adjudicator) => adjudicator.isChair)
    .map((adjudicator) => adjudicator.member?.name ?? adjudicator.cabinet?.name ?? adjudicator.president?.name ?? null)
    .filter((name): name is string => Boolean(name)) ?? [];

  if (chairNames.length === 0) {
    return session.Chair;
  }

  return chairNames.join(", ");
}

function deriveParticipantAssignmentLabels(session: ApiAdminSession) {
  const proposal = session.publishedProposal ?? session.acceptedProposal;
  const labels: Record<string, string> = {};

  proposal?.roomAssignments.forEach((room) => {
    room.teamAssignments.forEach((team) => {
      team.speakerAssignments.forEach((speaker) => {
        const participantId = speaker.member?.id ?? speaker.cabinet?.id ?? speaker.president?.id;
        if (!participantId) {
          return;
        }

        labels[participantId] = speaker.speakingRole;
      });
    });

    room.adjudicatorAssignments.forEach((adjudicator) => {
      const participantId = adjudicator.member?.id ?? adjudicator.cabinet?.id ?? adjudicator.president?.id;
      if (!participantId) {
        return;
      }

      labels[participantId] = adjudicator.isChair ? "Chair" : "Panel";
    });
  });

  return labels;
}

function deriveSessionsFromAttendance(attendanceHistory: AttendanceHistoryItem[]): SessionRow[] {
  return attendanceHistory.map((item) => ({
    id: item.session.id,
    date: item.session.sessionDate,
    motionType: item.session.motiontype,
    chair: item.session.Chair,
    state: item.speakerScore !== null ? "Scored" : "Preparation",
  }));
}

function normalizeParticipantSession(session: ApiParticipantSession): SessionRow {
  return {
    id: session.id,
    date: formatDate(session.sessionDate),
    motionType: session.motionType ?? session.motiontype,
    motionText: session.motionText ?? undefined,
    chair: session.Chair,
    assignedChairLabel: session.assignedChairLabel ?? undefined,
    state: deriveLifecycleState(session),
  };
}

function mergeParticipantSessions(
  attendanceSessions: SessionRow[],
  publishedSessions: SessionRow[],
): SessionRow[] {
  const merged = new Map<string, SessionRow>();

  for (const session of publishedSessions) {
    merged.set(session.id, session);
  }

  for (const session of attendanceSessions) {
    const current = merged.get(session.id);
    merged.set(session.id, {
      ...current,
      ...session,
      // The published-session read derives lifecycle state from the server's
      // pairing/publication/scoring statuses; the attendance-derived state is
      // only a guess ("Preparation"/"Scored") and must not downgrade it.
      state: current?.state ?? session.state,
      date: current?.date ?? session.date,
      motionType: current?.motionType ?? session.motionType,
      motionText: session.motionText ?? current?.motionText,
      chair: current?.chair ?? session.chair,
      assignedChairLabel: current?.assignedChairLabel ?? session.assignedChairLabel,
      participantAssignmentLabels: current?.participantAssignmentLabels ?? session.participantAssignmentLabels,
    });
  }

  return [...merged.values()].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}

function deriveLifecycleState(session: {
  pairingStatus?: string | null;
  publicationStatus?: string | null;
  scoringStatus?: string | null;
  publishedProposal?: { roomAssignments: Array<unknown> } | null;
  acceptedProposal?: { roomAssignments: Array<unknown> } | null;
  attendance?: Array<{
    status: string;
    pairingCode?: string | null;
    debatedAlone?: boolean;
    speakerScore?: number | null;
  }>;
}): SessionRow["state"] {
  const pairingStatus = session.pairingStatus?.toUpperCase();
  const publicationStatus = session.publicationStatus?.toUpperCase();
  const scoringStatus = session.scoringStatus?.toLowerCase();

  if (scoringStatus === "complete") {
    return "Scored";
  }

  if (session.publishedProposal || publicationStatus === "PUBLISHED" || pairingStatus === "PUBLISHED") {
    return "Published";
  }

  if (session.acceptedProposal || pairingStatus === "APPROVED") {
    return "Approved";
  }

  if (pairingStatus === "GENERATED") {
    return "Generated";
  }

  const attendance = session.attendance ?? [];
  const present = attendance.filter((entry) => entry.status === "Present");
  if (present.some((entry) => entry.speakerScore !== null && entry.speakerScore !== undefined)) {
    return "Scored";
  }
  return "Preparation";
}

function normalizeProgressSummary(summary: ApiProgressSummary): ProgressSummary {
  return {
    participantId: summary.participantId,
    speakerTotalScore: summary.speakerTotalScore,
    speakerStrength: summary.speakerStrength,
    confidence: summary.confidence,
    sessionsSpoken: summary.sessionsSpoken,
    sessionsAdjudicated: summary.sessionsAdjudicated,
    sessionsChaired: summary.sessionsChaired,
    scoredSpeakerSessions: summary.scoredSpeakerSessions,
    dataMaturity: summary.dataMaturity,
  };
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type ApiMember = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
};

type ApiCabinet = {
  id: string;
  name: string;
  email: string;
  position: string;
  isVerified: boolean;
};

type ApiPresident = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
};

type ApiAdminSession = {
  id: string;
  sessionDate: string;
  motiontype: string;
  motionType?: string | null;
  motionText?: string | null;
  pairingObjective?: string | null;
  pairingStatus?: string | null;
  publicationStatus?: string | null;
  scoringStatus?: string | null;
  Chair: string;
  attendance?: Array<{
    id: string;
    status: string;
    pairingCode?: string | null;
    debatedAlone?: boolean;
    speakerScore?: number | null;
    member?: { id: string; name: string } | null;
    cabinet?: { id: string; name: string } | null;
    president?: { id: string; name: string } | null;
  }>;
  acceptedProposal?: {
    roomAssignments: Array<{
      teamAssignments: Array<{
        bpPosition: string;
        speakerAssignments: Array<{
          speakingRole: string;
          member?: { id: string; name: string } | null;
          cabinet?: { id: string; name: string } | null;
          president?: { id: string; name: string } | null;
        }>;
      }>;
      adjudicatorAssignments: Array<{
        isChair: boolean;
        member?: { id: string; name: string } | null;
        cabinet?: { id: string; name: string } | null;
        president?: { id: string; name: string } | null;
      }>;
    }>;
  } | null;
  publishedProposal?: {
    roomAssignments: Array<{
      teamAssignments: Array<{
        bpPosition: string;
        speakerAssignments: Array<{
          speakingRole: string;
          member?: { id: string; name: string } | null;
          cabinet?: { id: string; name: string } | null;
          president?: { id: string; name: string } | null;
        }>;
      }>;
      adjudicatorAssignments: Array<{
        isChair: boolean;
        member?: { id: string; name: string } | null;
        cabinet?: { id: string; name: string } | null;
        president?: { id: string; name: string } | null;
      }>;
    }>;
  } | null;
};

type ApiAttendanceHistory = {
  id: string;
  memberId?: string | null;
  cabinetId?: string | null;
  presidentId?: string | null;
  status: string;
  speakerScore: number | null;
  pairingCode: string | null;
  debatedAlone: boolean;
  pairedWith?: string[];
  assignmentLabel?: string | null;
  session: {
    id: string;
    sessionDate: string | Date;
    motiontype: string;
    motionType?: string | null;
    Chair: string;
  };
};

type ApiParticipantSession = {
  id: string;
  sessionDate: string | Date;
  motiontype: string;
  motionType?: string | null;
  motionText?: string | null;
  Chair: string;
  assignedChairLabel?: string | null;
  pairingStatus?: string | null;
  publicationStatus?: string | null;
  scoringStatus?: string | null;
};

type ApiProgressSummary = {
  participantId: string;
  speakerTotalScore: number;
  speakerStrength: number;
  confidence: number;
  sessionsSpoken: number;
  sessionsAdjudicated: number;
  sessionsChaired: number;
  scoredSpeakerSessions: number;
  dataMaturity: "LOW" | "MEDIUM" | "HIGH";
};

type ApiSpeakerLeaderboardEntry = {
  participantId: string;
  name: string;
  score: number;
  rank: number;
  sessionsCount: number;
};

type ApiAdjudicatorLeaderboardEntry = {
  participantId: string;
  name: string;
  score: number;
  rank: number;
  sessionsCount: number;
  chairedCount: number;
  adjudicatedCount: number;
};
