"use client";

import React from "react";
import {
  House,
  Calendar,
  Mic2,
  Scale,
  ClipboardCheck,
  UserCircle,
  Swords,
} from "lucide-react";
import HomeDashboard from "./HomeDashboard";
import Sessions from "./Sessions";
import Leaderboards from "./Leaderboards";
import MyPairing from "./MyPairing";
import MyScoring from "./MyScoring";
import SparManagement from "./SparManagement";
import type {
  AdjudicatorLeaderboardRow,
  AttendanceHistoryItem,
  Participant,
  SessionRow,
  SpeakerLeaderboardRow,
} from "./types";

export type ParticipantTab =
  | "Home"
  | "MyPairing"
  | "MyScoring"
  | "SpeakerLeaderboard"
  | "AdjudicatorLeaderboard"
  | "Sessions"
  | "Spars";

export const PARTICIPANT_TABS: { key: ParticipantTab; label: string; icon: React.ReactNode }[] = [
  { key: "Home", label: "Home", icon: <House size={18} /> },
  { key: "MyPairing", label: "My Pairing", icon: <UserCircle size={18} /> },
  { key: "MyScoring", label: "My Scoring Tasks", icon: <ClipboardCheck size={18} /> },
  { key: "SpeakerLeaderboard", label: "Leaderboards", icon: <Mic2 size={18} /> },
  { key: "AdjudicatorLeaderboard", label: "Adj Leaderboard", icon: <Scale size={18} /> },
  { key: "Sessions", label: "Session History", icon: <Calendar size={18} /> },
  { key: "Spars", label: "Spars", icon: <Swords size={18} /> },
];

type ParticipantPairingDashboardProps = {
  role: string;
  userName: string;
  userId?: string | null;
  position?: string | null;
  sessions: SessionRow[];
  attendanceHistory: AttendanceHistoryItem[];
  participants: Participant[];
  sparParticipants: Participant[];
  speakerLeaderboard: SpeakerLeaderboardRow[];
  speakerRounds: number;
  adjudicatorLeaderboard: AdjudicatorLeaderboardRow[];
  leaderboardScope: "all" | "bi-monthly";
  loading: boolean;
  loadingLeaderboard: boolean;
  error: string | null;
  leaderboardError: string | null;
  onLeaderboardScopeChange: (scope: "all" | "bi-monthly") => void;
  onOpenLeaderboards: () => void;
  onOpenAdjudicatorLeaderboards: () => void;
  onRefresh?: () => void;
  activeTab?: ParticipantTab;
};

export default function ParticipantPairingDashboard({
  role,
  userName,
  userId = null,
  position = null,
  sessions,
  attendanceHistory,
  participants,
  sparParticipants,
  speakerLeaderboard,
  speakerRounds,
  adjudicatorLeaderboard,
  leaderboardScope,
  loading,
  loadingLeaderboard,
  error,
  leaderboardError,
  onLeaderboardScopeChange,
  onOpenLeaderboards,
  onOpenAdjudicatorLeaderboards,
  onRefresh,
  activeTab = "Home",
}: ParticipantPairingDashboardProps) {
  return (
    // The dashboard shell's <main> already applies page padding; padding here
    // doubled every margin on mobile.
    <div className="mx-auto max-w-6xl">
      {activeTab === "Home" && (
        <HomeDashboard
          role={role}
          userName={userName}
          position={position}
          sessions={sessions}
          attendanceHistory={attendanceHistory}
          participants={participants}
          speakerLeaderboard={speakerLeaderboard}
          adjudicatorLeaderboard={adjudicatorLeaderboard}
          onOpenLeaderboards={onOpenLeaderboards}
          onOpenAdjudicatorLeaderboards={onOpenAdjudicatorLeaderboards}
        />
      )}
      {activeTab === "MyPairing" && (
        <MyPairing
          role={role}
          userId={userId}
          sessions={sessions}
          attendanceHistory={attendanceHistory}
          participants={participants}
          speakerLeaderboard={speakerLeaderboard}
          adjudicatorLeaderboard={adjudicatorLeaderboard}
        />
      )}
      {activeTab === "MyScoring" && (
        <MyScoring
          role={role}
          userId={userId}
          sessions={sessions}
          attendanceHistory={attendanceHistory}
          onRefresh={onRefresh}
        />
      )}
      {activeTab === "SpeakerLeaderboard" && (
        <Leaderboards
          speakerLeaderboard={speakerLeaderboard}
          speakerRounds={speakerRounds}
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
      {activeTab === "Spars" && <SparManagement participants={sparParticipants} currentUserId={userId} />}
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
  );
}
