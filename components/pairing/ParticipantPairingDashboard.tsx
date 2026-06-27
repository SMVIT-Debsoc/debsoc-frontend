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

type Tab =
  | "MyPairing"
  | "MyScoring"
  | "Leaderboards"
  | "Sessions";

const PARTICIPANT_TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "MyPairing", label: "My Pairing", icon: <UserCircle size={18} /> },
  { key: "MyScoring", label: "My Scoring Tasks", icon: <ClipboardCheck size={18} /> },
  { key: "Leaderboards", label: "Leaderboards", icon: <Trophy size={18} /> },
  { key: "Sessions", label: "Session History", icon: <Calendar size={18} /> },
];

export default function ParticipantPairingDashboard() {
  const [tab, setTab] = useState<Tab>("MyPairing");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeTab = PARTICIPANT_TABS.find((t) => t.key === tab)?.key ?? PARTICIPANT_TABS[0].key;

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

        <nav className="flex flex-col gap-1">
          {PARTICIPANT_TABS.map((t) => (
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
          Data is mocked — backend per docs/01..15 is not built yet.
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === "MyPairing" && <MyPairing />}
          {activeTab === "MyScoring" && <MyScoring />}
          {activeTab === "Leaderboards" && <Leaderboards />}
          {activeTab === "Sessions" && <Sessions />}
        </div>
      </main>
    </div>
  );
}
