export type MemberId = string;
export type SessionId = string;
export type ProposalId = string;
export type PairKey = string;
export type MetricKey = string;
export type MotionType = string;

export const proposalStatuses = ["GENERATED", "APPROVED", "OVERRIDDEN", "PUBLISHED"] as const;
export type ProposalStatus = (typeof proposalStatuses)[number];

export const reviewActions = ["APPROVE", "OVERRIDE", "REGENERATE", "RATE"] as const;
export type ReviewAction = (typeof reviewActions)[number];

export const scoreSubmissionTypes = [
  "SPEAKER_CHAIR_RATING",
  "TEAM_DYNAMICS_RATING",
  "CHAIR_ADJUDICATOR_RATING",
  "ROOM_SPEAKER_SCORE",
] as const;
export type ScoreSubmissionType = (typeof scoreSubmissionTypes)[number];

export const leftoverReasons = [
  "INSUFFICIENT_SPEAKERS_FOR_FULL_ROOM",
  "ROLE_MISMATCH",
  "ADMIN_EXCLUDED",
  "CONSTRAINT_CONFLICT",
] as const;
export type LeftoverReason = (typeof leftoverReasons)[number];

export const pairingObjectives = ["DEVELOPMENT", "BALANCED", "COMPETITIVE"] as const;
export type PairingObjective = (typeof pairingObjectives)[number];

export const tuningModes = ["REVIEW_ASSISTED", "MANUAL_ONLY"] as const;
export type TuningMode = (typeof tuningModes)[number];

export const benchPositions = ["OG", "OO", "CG", "CO"] as const;
export type BenchPosition = (typeof benchPositions)[number];

export const speakingRoles = ["PM", "DPM", "LO", "DLO", "MG", "GW", "MO", "OW"] as const;
export type SpeakingRole = (typeof speakingRoles)[number];

export interface ProposalScoreBreakdown {
  roomBalanceScore: number;
  adjudicatorAverageScore: number;
  chairScore: number;
  teamQualityAggregate: number;
  experienceDistributionAggregate: number;
  totalProposalScore: number;
}

export interface PairingProposalSummary {
  proposalId: ProposalId;
  sessionId: SessionId;
  version: number;
  status: ProposalStatus;
  engineVersion: string;
  ruleVersion: string;
  topBandRank: number | null;
  proposalScore: number;
  scoreBreakdown: ProposalScoreBreakdown;
  generatedAt: string;
  generatedBy: MemberId | null;
  approvedAt: string | null;
  publishedAt: string | null;
  isPublishedOfficially: boolean;
}

export interface ProposalReviewPayload {
  proposalId: ProposalId;
  reviewerId: MemberId;
  action: ReviewAction;
  notes: string | null;
}

export interface ProposalRatingPayload {
  proposalId: ProposalId;
  reviewerId: MemberId;
  rating: number;
  issueTags: string[];
  notes: string | null;
}

export interface PairingRoomSpeaker {
  participantId: MemberId;
  speakingRole: SpeakingRole;
}

export interface PairingTeamView {
  bpPosition: BenchPosition;
  teamScore: number | null;
  speakers: PairingRoomSpeaker[];
}

export interface PairingAdjudicatorView {
  participantId: MemberId;
  isChair: boolean;
  chairAssignmentScore: number | null;
}

export interface PairingRoomView {
  roomIndex: number;
  roomScore: number | null;
  roomBalanceScore: number | null;
  roomDifficultyScore: number | null;
  teams: PairingTeamView[];
  adjudicators: PairingAdjudicatorView[];
}

export interface UnassignedParticipantView {
  participantId: MemberId;
  reason: LeftoverReason;
}

export interface PairingProposalView {
  summary: PairingProposalSummary;
  rooms: PairingRoomView[];
  unassignedParticipants: UnassignedParticipantView[];
  reviewState: {
    isApproved: boolean;
    isPublished: boolean;
    lastAction: ReviewAction | null;
  };
}

export interface OverrideProposalPayload {
  proposalId: ProposalId;
  reviewerId: MemberId;
  overrideType: string;
  payload: Record<string, unknown>;
  notes: string | null;
}

export interface GeneratePairingProposalRequest {
  sessionId: SessionId;
}

export interface GeneratePairingProposalResponse {
  proposal: PairingProposalView;
}

export interface ApproveProposalRequest {
  proposalId: ProposalId;
}

export interface ApproveProposalResponse {
  proposal: PairingProposalSummary;
}

export interface RegenerateProposalRequest {
  proposalId: ProposalId;
}

export interface RegenerateProposalResponse {
  proposal: PairingProposalView;
}

export interface RateProposalRequest {
  proposalId: ProposalId;
  rating: number;
  issueTags: string[];
  notes: string | null;
}

export interface RateProposalResponse {
  rating: ProposalRatingPayload;
}

export interface PublishPairingRequest {
  sessionId: SessionId;
}

export interface PublishedPairingView {
  sessionId: SessionId;
  proposalId: ProposalId;
  publishedAt: string;
  motionType: MotionType;
  motionText: string;
  rooms: PairingRoomView[];
  unassignedParticipants: UnassignedParticipantView[];
}

export interface PublishPairingResponse {
  publishedPairing: PublishedPairingView;
}

export interface GetPublishedPairingResponse {
  publishedPairing: PublishedPairingView;
}

export interface MemberMetricSnapshot {
  participantId: MemberId;
  metricKey: MetricKey;
  contextKey: string | null;
  value: number;
  observationCount: number;
  confidence: number;
}

export interface PairMetricSnapshot {
  pairKey: PairKey;
  memberAId: MemberId;
  memberBId: MemberId;
  metricKey: MetricKey;
  contextKey: string | null;
  value: number;
  observationCount: number;
  confidence: number;
}

export interface RoleHistorySummary {
  participantId: MemberId;
  roleCounts: Partial<Record<SpeakingRole, number>>;
}

export interface MotionTypeSummary {
  participantId: MemberId;
  motionTypeCounts: Record<MotionType, number>;
}

export interface AdjudicatorMetricSnapshot {
  participantId: MemberId;
  adjudicatorAverageScore: number;
  chairScore: number;
  confidence: number;
}

export interface SessionGenerationInfo {
  sessionId: SessionId;
  motionType: MotionType;
  motionText: string;
  pairingObjective: PairingObjective;
}

export type ParticipantKind = "member" | "cabinet" | "president";

export interface ParticipantContext {
  participantId: MemberId;
  participantKind: ParticipantKind;
  name: string;
  academicYear: number | null;
  sessionRole: import("@/types/session").SessionRole;
  isChairEligible: boolean;
}

export interface ActivePairingRules {
  timeConstraintParticipantIds: MemberId[];
  forcedTeamUps: Array<{ firstParticipantId: MemberId; secondParticipantId: MemberId; isStrict: boolean }>;
  forcedSeparations: Array<{ firstParticipantId: MemberId; secondParticipantId: MemberId; isStrict: boolean }>;
  forcedChairParticipantId: MemberId | null;
  forcedRoomCount: number | null;
}

export interface PairingGenerationContext {
  session: SessionGenerationInfo;
  participants: ParticipantContext[];
  memberMetricsById: Map<MemberId, MemberMetricSnapshot>;
  pairMetricsByKey: Map<PairKey, PairMetricSnapshot>;
  roleHistoryByMemberId: Map<MemberId, RoleHistorySummary>;
  motionTypeHistoryByMemberId: Map<MemberId, MotionTypeSummary>;
  adjudicatorMetricsById: Map<MemberId, AdjudicatorMetricSnapshot>;
  rules: ActivePairingRules;
}
