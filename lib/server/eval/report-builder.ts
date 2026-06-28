import type { BuildEvalReportInput, EvalReportData, EvalScenarioObservation } from "./types.ts";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildEvalReport(input: BuildEvalReportInput): EvalReportData {
  const validProposalRate = average(input.scenarios.map((scenario) => scenario.validProposalRate));
  const averageRoomBalanceScore = average(input.scenarios.map((scenario) => scenario.averageRoomBalanceScore));
  const repeatPartnerRate = average(input.scenarios.map((scenario) => scenario.repeatPartnerRate));
  const internalRoleRepetitionRate = average(input.scenarios.map((scenario) => scenario.internalRoleRepetitionRate));
  const chairAssignmentQualityScore = average(input.scenarios.map((scenario) => scenario.chairAssignmentQualityScore));
  const deltas = input.scenarios
    .filter((scenario) => scenario.baselineProposalScore != null)
    .map((scenario) => scenario.averageProposalScore - (scenario.baselineProposalScore ?? 0));
  const qualityDelta = average(deltas);
  const validityDelta = validProposalRate - (input.scenarios.some((scenario) => scenario.baselineProposalScore != null) ? 1 : validProposalRate);
  const stabilityDelta = average(input.scenarios.map((scenario) => scenario.scoreVariance));

  const overallResult =
    validProposalRate < 1 || qualityDelta < -0.01
      ? "FAIL"
      : averageRoomBalanceScore >= 0.8 && chairAssignmentQualityScore >= 0.65
        ? "PASS"
        : "WARN";

  const recommendation: EvalScenarioObservation["recommendation"] =
    overallResult === "PASS"
      ? "safe_to_keep"
      : overallResult === "WARN"
        ? "safe_but_needs_review"
        : "regression_detected";

  return {
    evalRunId: input.evalRunId,
    engineVersion: input.engineVersion,
    ruleVersion: input.ruleVersion,
    baselineVersion: input.baselineVersion,
    scenarios: input.scenarios,
    summary: {
      validProposalRate,
      averageRoomBalanceScore,
      repeatPartnerRate,
      internalRoleRepetitionRate,
      chairAssignmentQualityScore,
      qualityDelta,
      validityDelta,
      stabilityDelta,
      overallResult,
    },
    recommendation,
  };
}
