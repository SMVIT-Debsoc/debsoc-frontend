"use client";

import type {
  PairingProposalView,
  PublishedPairingView,
} from "@/types/pairing";
import type {
  SessionPreparationContextResponse,
  SessionScoringStatusResponse,
} from "@/types/session";

export type AccountType = "Member" | "Cabinet" | "President";

export type LifecycleState =
  | "Preparation"
  | "Generated"
  | "Approved"
  | "Published"
  | "Active"
  | "Completed"
  | "Scored";

export type Participant = {
  id: string;
  name: string;
  email?: string;
  account: AccountType;
  position?: string;
  isVerified?: boolean;
};

export type LegacySessionAttendance = {
  id: string;
  status: string;
  pairingCode?: string | null;
  debatedAlone?: boolean;
  speakerScore?: number | null;
  member?: { id: string; name: string } | null;
  cabinet?: { id: string; name: string } | null;
  president?: { id: string; name: string } | null;
};

export type SessionRow = {
  id: string;
  date: string;
  motionType: string;
  chair?: string;
  assignedChairLabel?: string;
  participantAssignmentLabels?: Record<string, string>;
  state: LifecycleState;
  attendance?: LegacySessionAttendance[];
};

export type AttendanceHistoryItem = {
  id: string;
  status: string;
  speakerScore: number | null;
  pairingCode: string | null;
  debatedAlone: boolean;
  pairedWith?: string[];
  session: {
    id: string;
    sessionDate: string;
    motiontype: string;
    Chair: string;
  };
};

export type LeaderboardRow = {
  id: string;
  name: string;
  type: string;
  score: number;
  sessions: number;
  rank: number;
};

export type ProgressSummary = {
  participantId: string;
  speakerTotalScore: number;
  speakerStrength: number;
  confidence: number;
  sessionsSpoken: number;
  sessionsAdjudicated: number;
  sessionsChaired: number;
  dataMaturity: "LOW" | "MEDIUM" | "HIGH";
};

export type WorkspaceSessionData = {
  context: SessionPreparationContextResponse | null;
  proposal: PairingProposalView | null;
  publishedPairing: PublishedPairingView | null;
  scoringStatus: SessionScoringStatusResponse | null;
};
