"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Trophy,
  Users,
  ClipboardCheck,
  UserCircle,
  Gavel,
  Menu,
  X,
} from "lucide-react";
import SessionWorkspace from "./SessionWorkspace";
import Sessions from "./Sessions";
import Leaderboards from "./Leaderboards";
import Roster from "./Roster";
import MyPairing from "./MyPairing";
import MyScoring from "./MyScoring";
import type {
  AttendanceHistoryItem,
  LeaderboardRow,
  Participant,
  SessionRow,
} from "./types";

type Tab =
  | "Workspace"
  | "Sessions"
  | "Roster"
  | "Leaderboards"
  | "MyPairing"
  | "MyScoring";

type AdminPairingDashboardProps = {
  role: string;
  userName: string;
  participants: Participant[];
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
  leaderboard: LeaderboardRow[];
  leaderboardScope: "all" | "bi-monthly";
  loading: boolean;
  loadingLeaderboard: boolean;
  error: string | null;
  leaderboardError: string | null;
  onLeaderboardScopeChange: (scope: "all" | "bi-monthly") => void;
  embedded?: boolean;
};

const ADMIN_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "Workspace", label: "Session Workspace", icon: <LayoutDashboard size={18} /> },
  { key: "Sessions", label: "Sessions", icon: <Calendar size={18} /> },
  { key: "Roster", label: "Members & Cabinet", icon: <Users size={18} /> },
  { key: "Leaderboards", label: "Leaderboards", icon: <Trophy size={18} /> },
  { key: "MyPairing", label: "My Pairing", icon: <UserCircle size={18} /> },
  { key: "MyScoring", label: "My Scoring Tasks", icon: <ClipboardCheck size={18} /> },
];

export default function AdminPairingDashboard({
  role,
  userName,
  participants,
  sessions,
  attendanceHistory,
  leaderboard,
  leaderboardScope,
  loading,
  loadingLeaderboard,
  error,
  leaderboardError,
  onLeaderboardScopeChange,
  embedded = false,
}: AdminPairingDashboardProps) {
  const [tab, setTab] = useState<Tab>("Workspace");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeTab = ADMIN_TABS.find((entry) => entry.key === tab)?.key ?? ADMIN_TABS[0].key;

  const content = (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {ADMIN_TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === entry.key
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {entry.icon}
            <span>{entry.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "Workspace" && (
        <SessionWorkspace
          userName={userName}
          participants={participants}
          sessions={sessions}
          loading={loading}
          error={error}
        />
      )}
      {activeTab === "Sessions" && (
        <Sessions
          mode="admin"
          sessions={sessions}
          loading={loading}
          error={error}
        />
      )}
      {activeTab === "Roster" && (
        <Roster
          participants={participants}
          loading={loading}
          error={error}
        />
      )}
      {activeTab === "Leaderboards" && (
        <Leaderboards
          leaderboard={leaderboard}
          scope={leaderboardScope}
          loading={loadingLeaderboard}
          error={leaderboardError}
          onScopeChange={onLeaderboardScopeChange}
        />
      )}
      {activeTab === "MyPairing" && (
        <MyPairing
          role={role}
          attendanceHistory={attendanceHistory}
        />
      )}
      {activeTab === "MyScoring" && <MyScoring role={role} />}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <div className="sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2 font-semibold">
          <Gavel size={18} />
          <span>Pairing (Admin)</span>
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setSidebarOpen((value) => !value)}
          className="p-2 -mr-2"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } w-full bg-slate-900 p-5 text-slate-300 lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:flex-col`}
      >
        <div className="mb-8 hidden items-center gap-2 font-semibold tracking-wide text-white lg:flex">
          <Gavel size={18} />
          <span>Pairing (Admin)</span>
        </div>

        <nav className="flex flex-col gap-1">
          {ADMIN_TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => {
                setTab(entry.key);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                activeTab === entry.key
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              {entry.icon}
              <span>{entry.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 text-[11px] leading-snug text-slate-500">
          Pairing UI now reads live roster, sessions, attendance history, and leaderboard data from
          the current backend. Proposal generation and published pairing routes are still pending.
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="p-4 sm:p-6 lg:p-8">{content}</div>
      </main>
    </div>
  );
}
