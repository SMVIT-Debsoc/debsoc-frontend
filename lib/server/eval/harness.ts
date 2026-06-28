import { evalRepository } from "../repositories/eval-repository.ts";
import { buildEvalReport } from "./report-builder.ts";
import { runHistoricalReplay, runSyntheticReplay } from "./replay-runner.ts";
import type { EvalReplayRequest } from "../../../types/eval.ts";
import type { EvalReportData, EvalScenarioRecordInput } from "./types.ts";

interface EvalRepositoryContract {
  createEvalRunRecord(input: { engineVersion: string; ruleVersion: string; runType: string }): Promise<{ id: string }>;
  finalizeEvalRunRecord(input: { evalRunId: string; summaryJson: Record<string, unknown>; resultStatus: string }): Promise<unknown>;
  upsertEvalScenarios(scenarios: EvalScenarioRecordInput[]): Promise<Array<{ id: string; name: string }>>;
  createEvalScenarioResultRecords(input: { evalRunId: string; scenarios: EvalReportData["scenarios"]; scenarioIdsByName: Map<string, string> }): Promise<unknown>;
}

export async function runPairingEval(
  input: EvalReplayRequest,
  repository: EvalRepositoryContract = evalRepository as EvalRepositoryContract,
): Promise<EvalReportData> {
  const replay = input.runType === "synthetic_replay"
    ? await runSyntheticReplay(input)
    : await runHistoricalReplay(input);

  const run = await repository.createEvalRunRecord({
    engineVersion: replay.engineVersion,
    ruleVersion: replay.ruleVersion,
    runType: input.runType,
  });

  const report = buildEvalReport({
    evalRunId: run.id,
    engineVersion: replay.engineVersion,
    ruleVersion: replay.ruleVersion,
    baselineVersion: replay.baselineVersion,
    scenarios: replay.scenarios,
  });

  const persistedScenarios = await repository.upsertEvalScenarios(
    replay.scenarios.map((scenario) => ({
      scenarioType: scenario.scenarioType,
      name: scenario.name,
      inputJson: { scenarioId: scenario.scenarioId, runCount: scenario.runCount },
      expectedSignalsJson: { baselineProposalScore: scenario.baselineProposalScore },
    })),
  );

  await repository.createEvalScenarioResultRecords({
    evalRunId: run.id,
    scenarios: report.scenarios,
    scenarioIdsByName: new Map(persistedScenarios.map((scenario) => [scenario.name, scenario.id])),
  });

  await repository.finalizeEvalRunRecord({
    evalRunId: run.id,
    summaryJson: {
      summary: report.summary,
      recommendation: report.recommendation,
      scenarioCount: report.scenarios.length,
    },
    resultStatus: report.summary.overallResult,
  });

  return report;
}
