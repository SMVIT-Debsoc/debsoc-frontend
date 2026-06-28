import type { PairingObjective, ProposalId, SessionId, TuningMode } from "../../../types/pairing.ts";

export interface EvalScenarioDefinition {
  scenarioId: string;
  scenarioType: "historical" | "synthetic";
  name: string;
  difficulty: string;
  sessionId: SessionId | null;
  inputJson: Record<string, unknown>;
  expectedSignalsJson: Record<string, unknown> | null;
}

export interface EvalScenarioObservation {
  runIndex: number;
  seed: number;
  ok: boolean;
  proposalId: ProposalId | null;
  proposalScore: number;
  roomBalanceScore: number;
  chairAssignmentQualityScore: number;
  repeatPartnerRate: number;
  internalRoleRepetitionRate: number;
  recommendation: "safe_to_keep" | "safe_but_needs_review" | "regression_detected" | "invalid_configuration" | "insufficient_data";
  failureReason: string | null;
}

export interface EvalScenarioAggregate {
  scenarioId: string;
  scenarioType: "historical" | "synthetic";
  name: string;
  runCount: number;
  validProposalRate: number;
  averageProposalScore: number;
  averageRoomBalanceScore: number;
  repeatPartnerRate: number;
  internalRoleRepetitionRate: number;
  chairAssignmentQualityScore: number;
  scoreVariance: number;
  baselineProposalScore: number | null;
  recommendation: EvalScenarioObservation["recommendation"];
}

export interface ReplayExecutionInput {
  scenarioSet: string;
  runsPerScenario: number;
  baselineVersion: string | null;
}

export interface ReplayExecutionResult {
  engineVersion: string;
  ruleVersion: string;
  baselineVersion: string | null;
  scenarios: EvalScenarioAggregate[];
}

export interface EvalSummary {
  validProposalRate: number;
  averageRoomBalanceScore: number;
  repeatPartnerRate: number;
  internalRoleRepetitionRate: number;
  chairAssignmentQualityScore: number;
  qualityDelta: number;
  validityDelta: number;
  stabilityDelta: number;
  overallResult: "PASS" | "WARN" | "FAIL";
}

export interface EvalReportData {
  evalRunId: string;
  engineVersion: string;
  ruleVersion: string;
  baselineVersion: string | null;
  scenarios: EvalScenarioAggregate[];
  summary: EvalSummary;
  recommendation: EvalScenarioObservation["recommendation"];
}

export interface EvalRegressionComparison {
  candidateEvalRunId: string;
  baselineEvalRunId: string;
  improvedMetrics: string[];
  regressedMetrics: string[];
  unchangedMetrics: string[];
  decision: "PASS" | "WARN" | "FAIL";
}

export interface HistoricalReplayInput extends ReplayExecutionInput {}

export interface SyntheticReplayInput extends ReplayExecutionInput {
  scenarios?: EvalScenarioDefinition[];
}

export interface BuildEvalReportInput {
  evalRunId: string;
  engineVersion: string;
  ruleVersion: string;
  baselineVersion: string | null;
  scenarios: EvalScenarioAggregate[];
}

export interface TuningWindowInput {
  windowStartSessionId: SessionId;
  windowEndSessionId: SessionId;
  tuningMode: TuningMode;
}

export interface MetricAdjustmentSuggestion {
  metricKey: string;
  currentAdjustment: number;
  suggestedDelta: number;
  suggestedAdjustment: number;
  reason: string;
  requiresReview: true;
}

export interface TuningReviewResult {
  windowId: string;
  windowStartSessionId: SessionId;
  windowEndSessionId: SessionId;
  sessionCount: number;
  relatedProposalIds: ProposalId[];
  tuningMode: TuningMode;
  analysisJson: {
    averageProposalScore: number;
    averageAdminRating: number | null;
    averageOutcomeScore: number | null;
    averageChairFeedback: number | null;
    suggestions: MetricAdjustmentSuggestion[];
  };
}

export interface EvalScenarioRecordInput {
  scenarioType: "historical" | "synthetic";
  name: string;
  inputJson: Record<string, unknown>;
  expectedSignalsJson: Record<string, unknown> | null;
}

export interface HistoricalReplayRecord {
  sessionId: SessionId;
  sessionDate: string;
  motionType: string;
  motionText: string;
  pairingObjective: PairingObjective;
  participantsPresent: string[];
  sessionRoles: Array<{ participantId: string; role: string; isChair: boolean }>;
  actualPublishedProposalScore: number | null;
  adminPairingRating: number | null;
  averageTeamResultPoints: number | null;
  averageChairFeedback: number | null;
}
