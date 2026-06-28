import { evalRepository } from "../repositories/eval-repository.ts";
import type { EvalRegressionComparison, EvalReportData } from "./types.ts";

interface EvalReportRepositoryContract {
  getEvalReportData(evalRunId: string): Promise<EvalReportData | null>;
}

export function compareEvalReports(candidate: EvalReportData, baseline: EvalReportData): EvalRegressionComparison {
  const improvedMetrics: string[] = [];
  const regressedMetrics: string[] = [];
  const unchangedMetrics: string[] = [];

  const comparisons: Array<{ key: string; candidate: number; baseline: number; higherIsBetter: boolean }> = [
    { key: "validProposalRate", candidate: candidate.summary.validProposalRate, baseline: baseline.summary.validProposalRate, higherIsBetter: true },
    { key: "averageRoomBalanceScore", candidate: candidate.summary.averageRoomBalanceScore, baseline: baseline.summary.averageRoomBalanceScore, higherIsBetter: true },
    { key: "repeatPartnerRate", candidate: candidate.summary.repeatPartnerRate, baseline: baseline.summary.repeatPartnerRate, higherIsBetter: false },
    { key: "internalRoleRepetitionRate", candidate: candidate.summary.internalRoleRepetitionRate, baseline: baseline.summary.internalRoleRepetitionRate, higherIsBetter: false },
    { key: "chairAssignmentQualityScore", candidate: candidate.summary.chairAssignmentQualityScore, baseline: baseline.summary.chairAssignmentQualityScore, higherIsBetter: true },
    { key: "stabilityDelta", candidate: candidate.summary.stabilityDelta, baseline: baseline.summary.stabilityDelta, higherIsBetter: false },
  ];

  for (const comparison of comparisons) {
    if (comparison.candidate === comparison.baseline) {
      unchangedMetrics.push(comparison.key);
      continue;
    }

    const improved = comparison.higherIsBetter
      ? comparison.candidate > comparison.baseline
      : comparison.candidate < comparison.baseline;

    if (improved) {
      improvedMetrics.push(comparison.key);
    } else {
      regressedMetrics.push(comparison.key);
    }
  }

  const decision =
    candidate.summary.validProposalRate < baseline.summary.validProposalRate || candidate.summary.qualityDelta < -0.01
      ? "FAIL"
      : regressedMetrics.length > improvedMetrics.length
        ? "WARN"
        : "PASS";

  return {
    candidateEvalRunId: candidate.evalRunId,
    baselineEvalRunId: baseline.evalRunId,
    improvedMetrics,
    regressedMetrics,
    unchangedMetrics,
    decision,
  };
}

export async function compareStoredEvalReports(
  input: { candidateEvalRunId: string; baselineEvalRunId: string },
  repository: EvalReportRepositoryContract = evalRepository as EvalReportRepositoryContract,
): Promise<EvalRegressionComparison> {
  const [candidate, baseline] = await Promise.all([
    repository.getEvalReportData(input.candidateEvalRunId),
    repository.getEvalReportData(input.baselineEvalRunId),
  ]);

  if (!candidate || !baseline) {
    throw new Error("Eval run not found.");
  }

  return compareEvalReports(candidate, baseline);
}
