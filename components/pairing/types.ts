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
  motionText?: string;
  chair?: string;
  assignedChairLabel?: string;
  participantAssignmentLabels?: Record<string, string>;
  state: LifecycleState;
  attendance?: LegacySessionAttendance[];
};

export type AttendanceHistoryItem = {
  id: string;
  participantId?: string;
  /**
   * Every non-null identity id (memberId / cabinetId / presidentId) attached
   * to this attendance row. Used to match against room / task participantIds
   * when a user may be represented by more than one identity id.
   */
  participantIds?: string[];
  status: string;
  speakerScore: number | null;
  pairingCode: string | null;
  debatedAlone: boolean;
  pairedWith?: string[];
  /** Published-room role label (e.g. "PM (OG)", "Chair") when the session was engine-published. */
  assignmentLabel?: string | null;
  session: {
    id: string;
    sessionDate: string;
    motiontype: string;
    Chair: string;
  };
};

export type SpeakerLeaderboardRow = {
  id: string;
  name: string;
  type: string;
  score: number;
  sessions: number;
  rank: number;
};

export type AdjudicatorLeaderboardRow = {
  id: string;
  name: string;
  type: string;
  score: number;
  sessions: number;
  chairedCount: number;
  adjudicatedCount: number;
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
  scoredSpeakerSessions: number;
  dataMaturity: "LOW" | "MEDIUM" | "HIGH";
};

export type ProgressProfile = {
  participantId: string;
  attendance: {
    presentCount: number;
    totalCount: number;
    attendancePercentage: number;
  };
  summary: ProgressSummary;
  motionTypeScores: Array<{
    motionType: string;
    score: number;
    observationCount: number;
    confidence: number;
  }>;
  roleScores: Array<{
    role: string;
    score: number;
    observationCount: number;
    confidence: number;
  }>;
  compatibilityProfiles: Array<{
    participantId: string;
    name: string;
    score: number;
    observationCount: number;
    confidence: number;
  }>;
  rawMetrics: Array<{
    metricKey: string;
    contextKey: string | null;
    value: number;
    observationCount: number;
    confidence: number;
  }>;
  verdict: {
    strengths: string[];
    weaknesses: string[];
    gaps: string[];
    roleAptitude: string[];
    compatibility: string[];
  };
};

export type WorkspaceSessionData = {
  context: SessionPreparationContextResponse | null;
  proposal: PairingProposalView | null;
  publishedPairing: PublishedPairingView | null;
  scoringStatus: SessionScoringStatusResponse | null;
};
