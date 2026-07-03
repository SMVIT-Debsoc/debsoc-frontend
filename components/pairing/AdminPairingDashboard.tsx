"use client";

import React from "react";
import {
  House,
  LayoutDashboard,
  Calendar,
  Mic2,
  Scale,
  Users,
  ClipboardCheck,
  UserCircle,
} from "lucide-react";
import HomeDashboard from "./HomeDashboard";
import SessionWorkspace from "./SessionWorkspace";
import Sessions from "./Sessions";
import Leaderboards from "./Leaderboards";
import Roster from "./Roster";
import MyPairing from "./MyPairing";
import MyScoring from "./MyScoring";
import type { RealtimeEventEnvelope } from "@/types/realtime";
import type {
  AdjudicatorLeaderboardRow,
  AttendanceHistoryItem,
  Participant,
  ProgressSummary,
  SessionRow,
  SpeakerLeaderboardRow,
} from "./types";

export type AdminTab =
  | "Home"
  | "Workspace"
  | "Sessions"
  | "Roster"
  | "SpeakerLeaderboard"
  | "AdjudicatorLeaderboard"
  | "MyPairing"
  | "MyScoring";

export const ADMIN_TABS: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
  { key: "Home", label: "Home", icon: <House size={18} /> },
  { key: "Workspace", label: "Session Workspace", icon: <LayoutDashboard size={18} /> },
  { key: "Sessions", label: "Sessions", icon: <Calendar size={18} /> },
  { key: "Roster", label: "Members & Cabinet", icon: <Users size={18} /> },
  { key: "SpeakerLeaderboard", label: "Leaderboards", icon: <Mic2 size={18} /> },
  { key: "AdjudicatorLeaderboard", label: "Adj Leaderboard", icon: <Scale size={18} /> },
  { key: "MyPairing", label: "My Pairing", icon: <UserCircle size={18} /> },
  { key: "MyScoring", label: "My Scoring Tasks", icon: <ClipboardCheck size={18} /> },
];

type AdminPairingDashboardProps = {
  role: string;
  userName: string;
  participants: Participant[];
  sessions: SessionRow[];
  onSessionsChange: (sessions: SessionRow[]) => void;
  attendanceHistory: AttendanceHistoryItem[];
  speakerLeaderboard: SpeakerLeaderboardRow[];
  adjudicatorLeaderboard: AdjudicatorLeaderboardRow[];
  progressSummaries: ProgressSummary[];
  leaderboardScope: "all" | "bi-monthly";
  loading: boolean;
  loadingLeaderboard: boolean;
  error: string | null;
  leaderboardError: string | null;
  onLeaderboardScopeChange: (scope: "all" | "bi-monthly") => void;
  onOpenWorkspace: () => void;
  onOpenLeaderboards: () => void;
  onOpenAdjudicatorLeaderboards: () => void;
  onRefresh?: () => void;
  workspaceRealtimeEvent?: RealtimeEventEnvelope | null;
  activeTab?: AdminTab;
};

export default function AdminPairingDashboard({
  role,
  userName,
  participants,
  sessions,
  onSessionsChange,
  attendanceHistory,
  speakerLeaderboard,
  adjudicatorLeaderboard,
  progressSummaries,
  leaderboardScope,
  loading,
  loadingLeaderboard,
  error,
  leaderboardError,
  onLeaderboardScopeChange,
  onOpenWorkspace,
  onOpenLeaderboards,
  onOpenAdjudicatorLeaderboards,
  onRefresh,
  workspaceRealtimeEvent = null,
  activeTab = "Home",
}: AdminPairingDashboardProps) {
  return (
    <div className="mx-auto max-w-6xl">
      {activeTab === "Home" && (
        <HomeDashboard
          role={role}
          userName={userName}
          sessions={sessions}
          attendanceHistory={attendanceHistory}
          participants={participants}
          speakerLeaderboard={speakerLeaderboard}
          adjudicatorLeaderboard={adjudicatorLeaderboard}
          onOpenLeaderboards={onOpenLeaderboards}
          onOpenAdjudicatorLeaderboards={onOpenAdjudicatorLeaderboards}
          onOpenWorkspace={onOpenWorkspace}
        />
      )}
      {activeTab === "Workspace" && (
        <SessionWorkspace
          userName={userName}
          participants={participants}
          sessions={sessions}
          onSessionsChange={onSessionsChange}
          realtimeEvent={workspaceRealtimeEvent}
          loading={loading}
          error={error}
        />
      )}
      {activeTab === "Sessions" && (
        <Sessions mode="admin" sessions={sessions} loading={loading} error={error} />
      )}
      {activeTab === "Roster" && (
        <Roster
          participants={participants}
          progressSummaries={progressSummaries}
          loading={loading}
          error={error}
        />
      )}
      {activeTab === "SpeakerLeaderboard" && (
        <Leaderboards
          speakerLeaderboard={speakerLeaderboard}
          adjudicatorLeaderboard={adjudicatorLeaderboard}
          scope={leaderboardScope}
          loading={loadingLeaderboard}
          error={leaderboardError}
          onScopeChange={onLeaderboardScopeChange}
          view="speakers"
        />
      )}
      {activeTab === "AdjudicatorLeaderboard" && (
        <Leaderboards
          speakerLeaderboard={speakerLeaderboard}
          adjudicatorLeaderboard={adjudicatorLeaderboard}
          scope={leaderboardScope}
          loading={loadingLeaderboard}
          error={leaderboardError}
          onScopeChange={onLeaderboardScopeChange}
          view="adjudicators"
        />
      )}
      {activeTab === "MyPairing" && (
        <MyPairing
          role={role}
          sessions={sessions}
          attendanceHistory={attendanceHistory}
          participants={participants}
          speakerLeaderboard={speakerLeaderboard}
          adjudicatorLeaderboard={adjudicatorLeaderboard}
        />
      )}
      {activeTab === "MyScoring" && (
        <MyScoring role={role} sessions={sessions} attendanceHistory={attendanceHistory} onRefresh={onRefresh} />
      )}
    </div>
  );
}






