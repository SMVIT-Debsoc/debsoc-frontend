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
  ClipboardPenLine,
  MessageCircle,
  Gavel,
  Newspaper,
} from "lucide-react";
import HomeDashboard from "./HomeDashboard";
import DigestPanel from "@/components/digest/DigestPanel";
import Sessions from "./Sessions";
import Leaderboards from "./Leaderboards";
import MyPairing from "./MyPairing";
import MyScoring from "./MyScoring";
import SparManagement from "./SparManagement";
import MockDrillWorkspace from "./MockDrillWorkspace";
import MockJudgeWorkspace from "./MockJudgeWorkspace";
import ChatWorkspace from "./ChatWorkspace";
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
  | "Spars"
  | "Chat"
  | "MockDrill"
  | "MockJudge"
  | "Digest";

export const PARTICIPANT_TABS: { key: ParticipantTab; label: string; icon: React.ReactNode }[] = [
  { key: "Home", label: "Home", icon: <House size={22} aria-hidden="true" /> },
  { key: "Digest", label: "Debate Digest", icon: <Newspaper size={22} aria-hidden="true" /> },
  { key: "Chat", label: "Debate Chat", icon: <MessageCircle size={22} aria-hidden="true" /> },
  { key: "MockDrill", label: "Mock Drill", icon: <ClipboardPenLine size={22} aria-hidden="true" /> },
  { key: "MockJudge", label: "Mock Judge", icon: <Gavel size={22} aria-hidden="true" /> },
  { key: "MyPairing", label: "My Pairing", icon: <UserCircle size={22} aria-hidden="true" /> },
  { key: "MyScoring", label: "My Scoring Tasks", icon: <ClipboardCheck size={22} aria-hidden="true" /> },
  { key: "SpeakerLeaderboard", label: "Leaderboards", icon: <Mic2 size={22} aria-hidden="true" /> },
  { key: "AdjudicatorLeaderboard", label: "Adj Leaderboard", icon: <Scale size={22} aria-hidden="true" /> },
  { key: "Sessions", label: "Session History", icon: <Calendar size={22} aria-hidden="true" /> },
  { key: "Spars", label: "Spars", icon: <Swords size={22} aria-hidden="true" /> },
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
  onOpenChat: () => void;
  onOpenMockDrill: () => void;
  onOpenMockJudge: () => void;
  onOpenDigest: () => void;
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
  onOpenChat,
  onOpenMockDrill,
  onOpenMockJudge,
  onOpenDigest,
  onRefresh,
  activeTab = "Home",
}: ParticipantPairingDashboardProps) {
  return (
    // The dashboard shell's <main> already applies page padding; padding here
    // doubled every margin on mobile.
    <div className="mx-auto w-full max-w-[1440px]">
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
          onOpenChat={onOpenChat}
          onOpenMockDrill={onOpenMockDrill}
          onOpenMockJudge={onOpenMockJudge}
          onOpenDigest={onOpenDigest}
        />
      )}
      {activeTab === "Digest" && <DigestPanel />}
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
      {activeTab === "Chat" && <ChatWorkspace />}
      {activeTab === "MockDrill" && <MockDrillWorkspace />}
      {activeTab === "MockJudge" && <MockJudgeWorkspace />}
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
