"use client";

import React, { useState } from "react";
import {
  Calendar,
  Trophy,
  ClipboardCheck,
  UserCircle,
  Gavel,
  Menu,
  X,
} from "lucide-react";
import Sessions from "./Sessions";
import Leaderboards from "./Leaderboards";
import MyPairing from "./MyPairing";
import MyScoring from "./MyScoring";
import type { AttendanceHistoryItem, LeaderboardRow, SessionRow } from "./types";

type Tab = "MyPairing" | "MyScoring" | "Leaderboards" | "Sessions";

type ParticipantPairingDashboardProps = {
  role: string;
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
  leaderboard: LeaderboardRow[];
  leaderboardScope: "all" | "bi-monthly";
  loading: boolean;
  loadingLeaderboard: boolean;
  error: string | null;
  leaderboardError: string | null;
  onLeaderboardScopeChange: (scope: "all" | "bi-monthly") => void;
};

const PARTICIPANT_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "MyPairing", label: "My Pairing", icon: <UserCircle size={18} /> },
  { key: "MyScoring", label: "My Scoring Tasks", icon: <ClipboardCheck size={18} /> },
  { key: "Leaderboards", label: "Leaderboards", icon: <Trophy size={18} /> },
  { key: "Sessions", label: "Session History", icon: <Calendar size={18} /> },
];

export default function ParticipantPairingDashboard({
  role,
  sessions,
  attendanceHistory,
  leaderboard,
  leaderboardScope,
  loading,
  loadingLeaderboard,
  error,
  leaderboardError,
  onLeaderboardScopeChange,
}: ParticipantPairingDashboardProps) {
  const [tab, setTab] = useState<Tab>("MyPairing");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeTab =
    PARTICIPANT_TABS.find((entry) => entry.key === tab)?.key ?? PARTICIPANT_TABS[0].key;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <div className="sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2 font-semibold">
          <Gavel size={18} />
          <span>Pairing</span>
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
          <span>Pairing</span>
        </div>

        <nav className="flex flex-col gap-1">
          {PARTICIPANT_TABS.map((entry) => (
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
          Pairing self-view now uses live attendance history. Published proposal and scoring-task
          APIs are still pending in the current backend.
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          {activeTab === "MyPairing" && (
            <MyPairing
              role={role}
              attendanceHistory={attendanceHistory}
            />
          )}
          {activeTab === "MyScoring" && <MyScoring role={role} sessions={sessions} attendanceHistory={attendanceHistory} />}
          {activeTab === "Leaderboards" && (
            <Leaderboards
              leaderboard={leaderboard}
              scope={leaderboardScope}
              loading={loadingLeaderboard}
              error={leaderboardError}
              onScopeChange={onLeaderboardScopeChange}
            />
          )}
          {activeTab === "Sessions" && (
            <Sessions
              mode="participant"
              sessions={sessions}
              attendanceHistory={attendanceHistory}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </main>
    </div>
  );
}
