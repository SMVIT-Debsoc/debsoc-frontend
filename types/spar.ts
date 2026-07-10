import type { BenchPosition, MemberId, MotionType, SpeakingRole } from "./pairing.ts";

export type SparId = string;
export type SparParticipantRole = "Member" | "cabinet" | "President";

export const sparParticipantRoles = ["Member", "cabinet", "President"] as const;

export const sparRolesByPosition = {
  OG: ["PM", "DPM"],
  OO: ["LO", "DLO"],
  CG: ["MG", "GW"],
  CO: ["MO", "OW"],
} as const satisfies Record<BenchPosition, readonly [SpeakingRole, SpeakingRole]>;

export interface SparSpeakerScoreInput {
  speakingRole: SpeakingRole;
  speakerScore: number;
}

export interface SubmitSparRequest {
  sparDate: string;
  motionType: MotionType;
  motionText?: string | null;
  bpPosition: BenchPosition;
  isIronMan: boolean;
  teammateId?: MemberId | null;
  teammateRole?: SparParticipantRole | null;
  teamRank: number;
  speakerScores: SparSpeakerScoreInput[];
}

export interface SparSpeakerScoreView {
  id: string;
  speakingRole: SpeakingRole;
  speakerScore: number;
}

export interface SparRecordView {
  id: SparId;
  sparDate: string;
  motionType: MotionType;
  motionText: string | null;
  bpPosition: BenchPosition;
  isIronMan: boolean;
  teamRank: number;
  teamResultPoints: number;
  teammateId: MemberId | null;
  teammateRole: SparParticipantRole | null;
  speakerScores: SparSpeakerScoreView[];
  createdAt: string;
  updatedAt: string;
}

export interface SparHistoryQuery {
  page: number;
  limit: number;
  sortBy: "sparDate" | "createdAt";
  sortOrder: "asc" | "desc";
}

export interface SparHistoryResponse {
  records: SparRecordView[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
  };
}

export interface SparLeaderboardQuery {
  page: number;
  limit: number;
}

export interface SparLeaderboardEntry {
  rank: number;
  userId: MemberId;
  userRole: SparParticipantRole;
  userName: string;
  totalSpars: number;
  currentStreak: number;
}

export interface SparLeaderboardResponse {
  rankings: SparLeaderboardEntry[];
  myRank: Omit<SparLeaderboardEntry, "userId" | "userRole" | "userName"> | null;
  totalParticipants: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function getSparRolesForPosition(position: BenchPosition): readonly [SpeakingRole, SpeakingRole] {
  return sparRolesByPosition[position];
}

export function teamRankToResultPoints(teamRank: number): number {
  switch (teamRank) {
    case 1:
      return 3;
    case 2:
      return 2;
    case 3:
      return 1;
    case 4:
      return 0;
    default:
      throw new Error(`Unsupported spar team rank: ${teamRank}`);
  }
}