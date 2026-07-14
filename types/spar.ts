import type { BenchPosition, MemberId, MotionType, SpeakingRole } from "./pairing.ts";

export type SparId = string;
export type SparParticipantRole = "Member" | "cabinet" | "President";
export type SparDebateFormat = "BP" | "AP";
export type ApSide = "GOV" | "OPP";
export type ApSpeakingRole = "PM" | "DPM" | "GOV_WHIP" | "LO" | "DLO" | "OPP_WHIP";
export type SparSpeakingRole = SpeakingRole | ApSpeakingRole;

export const sparParticipantRoles = ["Member", "cabinet", "President"] as const;
export const sparDebateFormats = ["BP", "AP"] as const;
export const apSides = ["GOV", "OPP"] as const;
export const apSpeakingRoles = ["PM", "DPM", "GOV_WHIP", "LO", "DLO", "OPP_WHIP"] as const;
export const sparSpeakingRoles = ["PM", "DPM", "LO", "DLO", "MG", "GW", "MO", "OW", "GOV_WHIP", "OPP_WHIP"] as const;

export const sparRolesByPosition = {
  OG: ["PM", "DPM"],
  OO: ["LO", "DLO"],
  CG: ["MG", "GW"],
  CO: ["MO", "OW"],
} as const satisfies Record<BenchPosition, readonly [SpeakingRole, SpeakingRole]>;

export const sparRolesByApSide = {
  GOV: ["PM", "DPM", "GOV_WHIP"],
  OPP: ["LO", "DLO", "OPP_WHIP"],
} as const satisfies Record<ApSide, readonly [ApSpeakingRole, ApSpeakingRole, ApSpeakingRole]>;

export interface SparSpeakerScoreInput {
  speakingRole: SparSpeakingRole;
  speakerScore: number;
}

export interface SparTeammateInput {
  id: MemberId;
  role: SparParticipantRole;
}

export interface SubmitSparRequest {
  sparDate: string;
  motionType: MotionType;
  motionText?: string | null;
  debateFormat?: SparDebateFormat;
  bpPosition?: BenchPosition | null;
  apSide?: ApSide | null;
  isIronMan: boolean;
  teammateId?: MemberId | null;
  teammateRole?: SparParticipantRole | null;
  teammates?: SparTeammateInput[];
  teamRank: number;
  speakerScores: SparSpeakerScoreInput[];
}

export interface SparSpeakerScoreView {
  id: string;
  speakingRole: SparSpeakingRole;
  speakerScore: number;
}

export interface SparTeammateView {
  id: string;
  participantId: MemberId;
  participantRole: SparParticipantRole;
}

export interface SparRecordView {
  id: SparId;
  sparDate: string;
  motionType: MotionType;
  motionText: string | null;
  debateFormat: SparDebateFormat;
  bpPosition: BenchPosition | null;
  apSide: ApSide | null;
  isIronMan: boolean;
  teamRank: number;
  teamResultPoints: number;
  teammateId: MemberId | null;
  teammateRole: SparParticipantRole | null;
  teammates: SparTeammateView[];
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

export function getSparRolesForApSide(side: ApSide): readonly [ApSpeakingRole, ApSpeakingRole, ApSpeakingRole] {
  return sparRolesByApSide[side];
}

export function mapApRoleToBpRole(role: SparSpeakingRole): SpeakingRole {
  if (role === "GOV_WHIP") return "GW";
  if (role === "OPP_WHIP") return "OW";
  return role as SpeakingRole;
}

export function teamRankToResultPoints(teamRank: number, debateFormat: SparDebateFormat = "BP"): number {
  if (debateFormat === "AP") {
    switch (teamRank) {
      case 1:
        return 3;
      case 2:
        return 0;
      default:
        throw new Error(`Unsupported AP spar team rank: ${teamRank}`);
    }
  }

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
      throw new Error(`Unsupported BP spar team rank: ${teamRank}`);
  }
}