import type { ProposalId, SessionId, TuningMode } from "@/types/pairing";

export interface EvalReplayRequest {
  runType: "historical_replay" | "synthetic_replay";
  scenarioSet: string;
  runsPerScenario: number;
  baselineVersion: string | null;
}

export interface EvalCompareRequest {
  candidateEvalRunId: string;
  baselineEvalRunId: string;
}

export interface EvalScenarioResult {
  scenarioId: string;
  validity: Record<string, boolean>;
  quality: Record<string, number>;
  recommendation: string;
}

export interface EvalReport {
  evalRunId: string;
  engineVersion: string;
  ruleVersion: string;
  results: EvalScenarioResult[];
  summary: {
    validityScore: number;
    roomBalanceScore: number;
    repetitionControlScore: number;
    objectiveBehaviorScore: number;
    adminAlignmentScore: number;
    outcomeAlignmentScore: number;
  };
}

export interface RegressionComparison {
  candidateEvalRunId: string;
  baselineEvalRunId: string;
  improvedMetrics: string[];
  regressedMetrics: string[];
  unchangedMetrics: string[];
}

export interface TuningWindowSummary {
  windowStartSessionId: SessionId;
  windowEndSessionId: SessionId;
  sessionCount: number;
  tuningMode: TuningMode;
  relatedProposalIds: ProposalId[];
}
