import type {
  ActivePairingRules,
  AdjudicatorMetricSnapshot,
  PairMetricSnapshot,
  PairingGenerationContext,
  PairingObjective,
  ParticipantContext,
  PairingRoomView,
  ProposalScoreBreakdown,
  ReviewAction,
  RoleHistorySummary,
  MotionTypeSummary,
  UnassignedParticipantView,
  BenchPosition,
  SpeakingRole,
} from "../../../types/pairing.ts";
import type { SessionRole } from "../../../types/session.ts";

export const MAX_CANDIDATE_COUNT = 64;
export const MAX_GENERATION_TIME_BUDGET_MS = 250;
export const TOP_BAND_SIZE = 5;
export const SPEAKERS_PER_ROOM = 8;
export const SPEAKERS_PER_TEAM = 2;
export const TEAMS_PER_ROOM = 4;
export const MAX_ADJUDICATORS_PER_ROOM = 3;

export interface SessionSpeaker extends ParticipantContext {
  sessionRole: "speaker";
}

export interface SessionAdjudicator extends ParticipantContext {
  sessionRole: "adjudicator";
}

export interface RoomPlan {
  roomCount: number;
  leftoverSpeakerCount: number;
}

export interface PairingRoomSpeakerCandidate {
  participantId: string;
  speakingRole: SpeakingRole;
}

export interface TeamCandidate {
  bpPosition: BenchPosition;
  teamScore: number | null;
  speakers: PairingRoomSpeakerCandidate[];
}

export interface AdjudicatorCandidate {
  participantId: string;
  isChair: boolean;
  chairAssignmentScore: number | null;
}

export interface RoomCandidate {
  roomIndex: number;
  roomScore: number | null;
  roomBalanceScore: number | null;
  roomDifficultyScore: number | null;
  teams: TeamCandidate[];
  adjudicators: AdjudicatorCandidate[];
}

export interface PairingCandidate {
  rooms: RoomCandidate[];
  unassignedParticipants: UnassignedParticipantView[];
}

export interface ScoredPairingCandidate extends PairingCandidate {
  proposalScore: number;
  scoreBreakdown: ProposalScoreBreakdown;
}

export interface HardRuleViolation {
  code: string;
  message: string;
}

export interface HardRuleValidationResult {
  isValid: boolean;
  violations: HardRuleViolation[];
}

export interface FallbackMetricInput {
  observationCount: number;
  targetCount: number;
  specificMetric: number;
  fallbackMetric: number;
}

export type ObjectiveMetricMultipliers = Record<string, number>;

export interface ChairAssignmentInput {
  chairScore: number;
  adjudicatorAverageScore: number;
  chairConfidenceScore: number;
}

export interface ChairAllocationContext {
  rooms: Array<{ roomIndex: number; roomDifficultyScore: number | null }>;
  adjudicators: Array<SessionAdjudicator & { metrics: AdjudicatorMetricSnapshot | null }>;
}

export interface ChairAllocationResult {
  roomChairs: Array<{ roomIndex: number; participantId: string; chairAssignmentScore: number }>;
  panelAssignments: Array<{ roomIndex: number; participantId: string }>;
  reserveAdjudicatorIds: string[];
}

export interface PairingMetricContext {
  definitions: Array<{
    key: string;
    category: string;
    baseWeight: number;
    isEnabled: boolean;
    isHardRule: boolean;
    isSoftRule: boolean;
    scope: string;
    fallbackConfigJson: unknown;
  }>;
  adjustmentsByMetricKey: Map<string, number>;
}

export interface SessionInputContext {
  objective: PairingObjective;
  rules: ActivePairingRules;
}

export interface SelectionAuditRecord {
  seed: number;
  selectedRank: number;
  selectedProbability: number;
  topBandSize: number;
}

export interface SelectionOptions {
  seed: number;
  topBandSize?: number;
}

export interface SelectionResult {
  candidate: ScoredPairingCandidate;
  audit: SelectionAuditRecord;
}

export interface PairingMetricsLoader {
  loadPairingMetrics(sessionId: string): Promise<PairingMetricContext>;
  loadSessionInputs(sessionId: string): Promise<SessionInputContext>;
}

export type PairingInternalRoleHistoryMap = Map<string, RoleHistorySummary>;
export type PairingInternalMotionTypeHistoryMap = Map<string, MotionTypeSummary>;
export type PairingInternalPairMetricMap = Map<string, PairMetricSnapshot>;
export type PairingInternalContext = PairingGenerationContext;