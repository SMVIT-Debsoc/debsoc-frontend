"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Gavel, LogOut, Menu, X } from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";
import PairingBackdrop from "./PairingBackdrop";
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
  position?: string | null;
  embedded?: boolean;
};

type PairingDataState = {
  participants: Participant[];
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
  speakerLeaderboard: SpeakerLeaderboardRow[];
  adjudicatorLeaderboard: AdjudicatorLeaderboardRow[];
  progressSummaries: ProgressSummary[];
  loading: boolean;
  loadingLeaderboard: boolean;
  error: string | null;
  leaderboardError: string | null;
  leaderboardScope: "all" | "bi-monthly";
};

// Compact labels for the mobile bottom bar (full labels stay in the drawer).
const BOTTOM_NAV_LABELS: Record<string, string> = {
  Home: "Home",
  Workspace: "Workspace",
  Sessions: "Sessions",
  SpeakerLeaderboard: "Ranks",
  MyPairing: "Pairing",
  MyScoring: "Scoring",
};

const INITIAL_STATE: PairingDataState = {
  participants: [],
  sessions: [],
  attendanceHistory: [],
  speakerLeaderboard: [],
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
  position = null,
  embedded = false,
}: PairingDashboardProps) {
  const [state, setState] = useState<PairingDataState>(INITIAL_STATE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("Home");
  const [participantTab, setParticipantTab] = useState<ParticipantTab>("Home");
  const isAdminView =
    role === "cabinet" || role === "President" || role === "TechHead";
  const navTabs = useMemo(
    () => (isAdminView ? ADMIN_TABS : PARTICIPANT_TABS),
    [isAdminView],
  );
  const activeTab = isAdminView ? adminTab : participantTab;

  const [primaryDataVersion, setPrimaryDataVersion] = useState(0);
  const refreshPrimaryData = () => setPrimaryDataVersion((v) => v + 1);
  const [leaderboardDataVersion, setLeaderboardDataVersion] = useState(0);
  const refreshLeaderboardData = () => setLeaderboardDataVersion((v) => v + 1);
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
  // modal-heavy flow.
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
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshPrimaryData();
    }, 30_000);
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
    const subscriptions: RealtimeSubscription[] = [{ scope: "LEADERBOARD" }];

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
        event.refetchHints.includes("scoring_status")
      ) {
        schedulePrimaryRefresh();
      }
    },
  });

  const selectTab = (key: string) => {
    if (isAdminView) {
      setAdminTab(key as AdminTab);
    } else {
      setParticipantTab(key as ParticipantTab);
    }
    setSidebarOpen(false);
    // Keep My Pairing stable while someone is viewing it; only overview/task
    // surfaces force an immediate refetch on entry.
    if (key === "MyScoring" || key === "Home") {
      refreshPrimaryData();
    }
  };

  // The most-used destinations, surfaced in the mobile bottom bar so common
  // navigation is a single tap (no drawer). Rest of the tabs live in the drawer.
  const primaryTabs = useMemo(() => {
    const primaryKeys = isAdminView
      ? ["Home", "Workspace", "Sessions", "SpeakerLeaderboard"]
      : ["Home", "MyPairing", "MyScoring", "SpeakerLeaderboard"];
    return primaryKeys
      .map((key) => navTabs.find((tab) => tab.key === key))
      .filter((tab): tab is (typeof navTabs)[number] => Boolean(tab));
  }, [isAdminView, navTabs]);

  const renderNav = (pillId: string) => (
    <nav className="flex flex-col gap-1">
      {navTabs.map((entry) => {
        const isActive = activeTab === entry.key;
        return (
          <button
            key={entry.key}
            type="button"
            onClick={() => selectTab(entry.key)}
            className={`relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
              isActive
                ? "text-white"
                : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 shadow-sm shadow-indigo-600/30"
                transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-3">
              {entry.icon}
              <span>{entry.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );

  const openLeaderboards = () => {
    if (isAdminView) {
      setAdminTab("SpeakerLeaderboard");
    } else {
      setParticipantTab("SpeakerLeaderboard");
    }
  };

  const openAdjudicatorLeaderboards = () => {
    if (isAdminView) {
      setAdminTab("AdjudicatorLeaderboard");
    } else {
      setParticipantTab("AdjudicatorLeaderboard");
    }
  };

  const content = isAdminView ? (
    <AdminPairingDashboard
      role={role}
      userName={userName}
      participants={state.participants}
      sessions={state.sessions}
      onSessionsChange={(sessions) =>
        setState((current) => ({ ...current, sessions }))
      }
      attendanceHistory={state.attendanceHistory}
      speakerLeaderboard={state.speakerLeaderboard}
      adjudicatorLeaderboard={state.adjudicatorLeaderboard}
      progressSummaries={state.progressSummaries}
      leaderboardScope={state.leaderboardScope}
      loading={state.loading}
      loadingLeaderboard={state.loadingLeaderboard}
      error={state.error}
      leaderboardError={state.leaderboardError}
      onLeaderboardScopeChange={(scope) =>
        setState((current) => ({ ...current, leaderboardScope: scope }))
      }
      onOpenWorkspace={() => setAdminTab("Workspace")}
      onOpenLeaderboards={openLeaderboards}
      onOpenAdjudicatorLeaderboards={openAdjudicatorLeaderboards}
      onRefresh={refreshPrimaryData}
      workspaceRealtimeEvent={workspaceRealtimeEvent}
      activeTab={adminTab}
    />
  ) : (
    <ParticipantPairingDashboard
      role={role}
      userName={userName}
      sessions={state.sessions}
      attendanceHistory={state.attendanceHistory}
      participants={state.participants}
      speakerLeaderboard={state.speakerLeaderboard}
      adjudicatorLeaderboard={state.adjudicatorLeaderboard}
      leaderboardScope={state.leaderboardScope}
      loading={state.loading}
      loadingLeaderboard={state.loadingLeaderboard}
      error={state.error}
      leaderboardError={state.leaderboardError}
      onLeaderboardScopeChange={(scope) =>
        setState((current) => ({ ...current, leaderboardScope: scope }))
      }
      onOpenLeaderboards={openLeaderboards}
      onOpenAdjudicatorLeaderboards={openAdjudicatorLeaderboards}
      onRefresh={refreshPrimaryData}
      activeTab={participantTab}
    />
  );

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
    <div className="pairing-shell relative min-h-screen overflow-x-clip text-slate-900 dark:text-slate-100 lg:flex">
      <PairingBackdrop key={activeTab} />
      {/* Mobile top bar */}
      <div className="glass-topbar sticky top-0 z-30 flex items-center justify-between gap-2 px-4 py-3 text-slate-900 dark:text-slate-100 lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setSidebarOpen(true)}
          className="-ml-2 flex items-center gap-2 rounded-lg p-2 font-semibold tracking-tight transition-colors hover:bg-slate-900/5 dark:hover:bg-white/10"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-600/30">
            <Menu size={16} />
          </span>
          <span className="truncate">{brand}</span>
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="glass-sidebar relative z-10 hidden w-72 flex-col p-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="mb-8 flex items-center gap-2.5 font-semibold tracking-tight text-slate-900 dark:text-white">
          <ProfileAvatar name={userName || firstName} className="h-9 w-9 shadow-sm shadow-indigo-600/30" initialsClassName="text-sm" />
          <span>{brand}</span>
        </div>

        {renderNav("pairing-nav-pill-desktop")}

        <div className="mt-auto flex items-center gap-2 pt-6">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile off-canvas drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="lg:hidden">
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="glass-drawer fixed inset-y-0 left-0 z-50 flex w-[82%] max-w-xs flex-col p-4"
              initial={{ transform: "translateX(-100%)" }}
              animate={{ transform: "translateX(0%)" }}
              exit={{ transform: "translateX(-100%)" }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.08 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5 font-semibold tracking-tight text-slate-900 dark:text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-600/30">
                    <Gavel size={17} />
                  </span>
                  <span>{brand}</span>
                </div>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-900/5 dark:hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {renderNav("pairing-nav-pill-drawer")}
              </div>

              <div className="mt-4 flex border-t border-slate-900/[0.06] pt-4 dark:border-white/[0.06]">
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
        className="content-enter relative z-10 min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8"
      >
        {content}
      </main>

      {/* Mobile bottom navigation - one-tap access to primary destinations */}
      <nav className="glass-topbar fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-slate-900/[0.06] px-1 pb-[env(safe-area-inset-bottom)] dark:border-white/[0.06] lg:hidden">
        {primaryTabs.map((entry) => {
          const isActive = activeTab === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => selectTab(entry.key)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 pt-1.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-indigo-600/10 dark:bg-indigo-400/15" : ""
                }`}
              >
                {entry.icon}
              </span>
              <span className="max-w-full truncate leading-none">
                {BOTTOM_NAV_LABELS[entry.key] ?? entry.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function LogoutButton() {
  return (
    <button
      type="button"
      aria-label="Log out"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/40 bg-red-500 px-4 text-sm font-semibold text-white shadow-sm shadow-red-500/25 transition hover:bg-red-600 active:scale-95 dark:border-red-400/40 dark:bg-red-500/90 dark:hover:bg-red-500"
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}

async function fetchPrimaryData(role: string) {
  if (role === "cabinet" || role === "President" || role === "TechHead") {
    const [bootstrap, attendance, progress] = await Promise.all([
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
    ]);

    return {
      participants: normalizeParticipants(bootstrap),
      sessions: bootstrap.sessions.map(normalizeAdminSession),
      attendanceHistory: (attendance.attendance ?? []).map(normalizeAttendanceHistory),
      progressSummaries: (progress.participants ?? []).map(normalizeProgressSummary),
    };
  }

  const attendance = await fetchJson<{
    attendance: ApiAttendanceHistory[];
    publishedSessions?: ApiParticipantSession[];
  }>(
    "/api/pairing/attendance/self",
  );
  const attendanceHistory = (attendance.attendance ?? []).map(normalizeAttendanceHistory);

  return {
    participants: [],
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
    fetchJson<{ leaderboard: ApiSpeakerLeaderboardEntry[] }>(
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

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const fallback = `Request failed for ${url}`;
      throw new Error(await readApiError(response, fallback));
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

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string };
    if (data.message && data.message.trim()) {
      return data.message;
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
    session: {
      id: item.session.id,
      sessionDate: formatDate(item.session.sessionDate),
      motiontype: item.session.motiontype,
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
    state: item.speakerScore !== null ? "Scored" : "Published",
  }));
}

function normalizeParticipantSession(session: ApiParticipantSession): SessionRow {
  return {
    id: session.id,
    date: formatDate(session.sessionDate),
    motionType: session.motiontype,
    motionText: session.motionText ?? undefined,
    chair: session.Chair,
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
  session: {
    id: string;
    sessionDate: string | Date;
    motiontype: string;
    Chair: string;
  };
};

type ApiParticipantSession = {
  id: string;
  sessionDate: string | Date;
  motiontype: string;
  motionText?: string | null;
  Chair: string;
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


