import type { BenchPosition, MemberId, SessionId, SpeakingRole } from "./pairing.ts";

export type ScoreValue = number;

export interface SpeakerScoringRequest {
  sessionId: SessionId;
  chairScore: ScoreValue;
  teamDynamicsRating?: ScoreValue | null;
  notes?: string | null;
}

export interface ChairAdjudicatorScoreEntry {
  adjudicatorMemberId: MemberId;
  rating: ScoreValue;
  notes?: string | null;
}

export interface RoomSpeakerScoreEntry {
  memberId: MemberId;
  rawScore: ScoreValue;
  bpPosition: BenchPosition;
  speakingRole: SpeakingRole;
  teamResultPoints: number;
}

export interface ChairScoringRequest {
  sessionId: SessionId;
  adjudicatorScores: ChairAdjudicatorScoreEntry[];
  speakerScores: RoomSpeakerScoreEntry[];
}

export interface ScoreSubmissionResponse {
  sessionId: SessionId;
  accepted: boolean;
}

export interface LeaderboardEntry {
  participantId: MemberId;
  name: string;
  score: number;
  rank: number;
  sessionsCount: number;
}

export interface SpeakerLeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export interface AdjudicatorLeaderboardEntry extends LeaderboardEntry {
  chairedCount: number;
  adjudicatedCount: number;
}

export interface AdjudicatorLeaderboardResponse {
  leaderboard: AdjudicatorLeaderboardEntry[];
}

export interface ParticipantProgressSummary {
  participantId: MemberId;
  speakerTotalScore: number;
  speakerStrength: number;
  confidence: number;
  sessionsSpoken: number;
  sessionsAdjudicated: number;
  sessionsChaired: number;
  // Number of sessions with a chair-submitted speaker score. Drives confidence
  // and data maturity, and can be lower than sessionsSpoken (which counts every
  // session the participant was paired as a speaker, scored or not).
  scoredSpeakerSessions: number;
  dataMaturity: "LOW" | "MEDIUM" | "HIGH";
}

export interface ParticipantMetricDetail {
  metricKey: string;
  contextKey: string | null;
  value: number;
  observationCount: number;
  confidence: number;
}

export interface ParticipantAttendanceProfile {
  presentCount: number;
  totalCount: number;
  attendancePercentage: number;
}

export interface ParticipantMotionTypeScore {
  motionType: string;
  score: number;
  observationCount: number;
  confidence: number;
}

export interface ParticipantRoleScore {
  role: string;
  score: number;
  observationCount: number;
  confidence: number;
}

export interface ParticipantCompatibilityProfile {
  participantId: MemberId;
  name: string;
  score: number;
  observationCount: number;
  confidence: number;
}

export interface ParticipantProgressProfile {
  participantId: MemberId;
  attendance: ParticipantAttendanceProfile;
  summary: ParticipantProgressSummary;
  motionTypeScores: ParticipantMotionTypeScore[];
  roleScores: ParticipantRoleScore[];
  compatibilityProfiles: ParticipantCompatibilityProfile[];
  rawMetrics: ParticipantMetricDetail[];
  verdict: {
    strengths: string[];
    weaknesses: string[];
    gaps: string[];
    roleAptitude: string[];
    compatibility: string[];
  };
}
