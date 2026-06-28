"use client";

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
};

export type SessionRow = {
  id: string;
  date: string;
  motionType: string;
  chair?: string;
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
