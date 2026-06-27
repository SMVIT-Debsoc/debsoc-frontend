import type { BenchPosition, MemberId, SessionId, SpeakingRole } from "@/types/pairing";

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
  dataMaturity: "LOW" | "MEDIUM" | "HIGH";
}

export interface ParticipantProgressProfile {
  participantId: MemberId;
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
}
