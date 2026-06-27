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

type Tab =
  | "Workspace"
  | "Sessions"
  | "Roster"
  | "Leaderboards"
  | "MyPairing"
  | "MyScoring";

type ViewAs = "Admin" | "Participant";

const ADMIN_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "Workspace", label: "Session Workspace", icon: <LayoutDashboard size={18} /> },
  { key: "Sessions", label: "Sessions", icon: <Calendar size={18} /> },
  { key: "Roster", label: "Members & Cabinet", icon: <Users size={18} /> },
  { key: "Leaderboards", label: "Leaderboards", icon: <Trophy size={18} /> },
  { key: "MyPairing", label: "My Pairing", icon: <UserCircle size={18} /> },
  { key: "MyScoring", label: "My Scoring Tasks", icon: <ClipboardCheck size={18} /> },
];

const PARTICIPANT_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "MyPairing", label: "My Pairing", icon: <UserCircle size={18} /> },
  { key: "MyScoring", label: "My Scoring Tasks", icon: <ClipboardCheck size={18} /> },
  { key: "Leaderboards", label: "Leaderboards", icon: <Trophy size={18} /> },
  { key: "Sessions", label: "Session History", icon: <Calendar size={18} /> },
];

export default function PairingDashboard() {
  const [viewAs, setViewAs] = useState<ViewAs>("Admin");
  const [tab, setTab] = useState<Tab>("Workspace");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = viewAs === "Admin" ? ADMIN_TABS : PARTICIPANT_TABS;

  // If the persisted tab isn't available in the current view, fall back to the
  // first tab for rendering — without writing state (avoids cascading renders).
  const activeTab = tabs.find((t) => t.key === tab)?.key ?? tabs[0].key;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* mobile topbar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white sticky top-0 z-40">
        <div className="flex items-center gap-2 font-semibold">
          <Gavel size={18} />
          <span>Pairing</span>
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setSidebarOpen((v) => !v)}
          className="p-2 -mr-2"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* sidebar */}
      <aside
        className={`${
          sidebarOpen ? "block" : "hidden"
        } lg:block lg:sticky lg:top-0 lg:h-screen w-full lg:w-64 bg-slate-900 text-slate-300 lg:flex flex-col p-5`}
      >
        <div className="hidden lg:flex items-center gap-2 text-white font-semibold tracking-wide mb-8">
          <Gavel size={18} />
          <span>Pairing</span>
        </div>

        <div className="mb-4">
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-1">
            View as
          </label>
          <div className="flex rounded-md overflow-hidden border border-slate-700">
            <button
              type="button"
              onClick={() => setViewAs("Admin")}
              className={`flex-1 px-3 py-1.5 text-sm ${
                viewAs === "Admin"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setViewAs("Participant")}
              className={`flex-1 px-3 py-1.5 text-sm ${
                viewAs === "Participant"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              Participant
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-snug">
            Admin = cabinet/president. Participant = any debater (member, cabinet, or
            president).
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === t.key
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 text-[11px] text-slate-500 leading-snug">
          Conceptual UI. Data is mocked — backend per docs/01..15 is not built yet.
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === "Workspace" && <SessionWorkspace />}
          {activeTab === "Sessions" && <Sessions />}
          {activeTab === "Roster" && <Roster />}
          {activeTab === "Leaderboards" && <Leaderboards />}
          {activeTab === "MyPairing" && <MyPairing />}
          {activeTab === "MyScoring" && <MyScoring />}
        </div>
      </main>
    </div>
  );
}
