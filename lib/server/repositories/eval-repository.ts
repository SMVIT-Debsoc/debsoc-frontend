import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type { EvalScenarioAggregate, EvalScenarioRecordInput, HistoricalReplayRecord, MetricAdjustmentSuggestion, TuningWindowInput } from "../eval/types.ts";

type EvalRepositoryClient = PrismaClient & Record<string, any>;

function resolveParticipantId(ref: { memberId: string | null; cabinetId: string | null; presidentId: string | null }) {
  return ref.memberId ?? ref.cabinetId ?? ref.presidentId ?? "";
}

export function createEvalRepository(client: EvalRepositoryClient = prisma as EvalRepositoryClient) {
  async function getHistoricalReplayDataset(sessionIds?: string[], baselineVersion?: string | null): Promise<HistoricalReplayRecord[]> {
    const sessions = await client.debateSession.findMany({
      where: sessionIds && sessionIds.length > 0 ? { id: { in: sessionIds } } : { publishedProposalId: { not: null } },
      select: {
        id: true,
        sessionDate: true,
        motionType: true,
        motiontype: true,
        motionText: true,
        pairingObjective: true,
        attendance: {
          where: { isPresent: true },
          select: { memberId: true, cabinetId: true, presidentId: true },
        },
        sessionRoleAssignments: {
          select: { memberId: true, cabinetId: true, presidentId: true, role: true, isChair: true },
        },
        pairingProposals: {
          where: {
            isPublishedOfficially: true,
            ...(baselineVersion ? { OR: [{ engineVersion: baselineVersion }, { ruleVersion: baselineVersion }] } : {}),
          },
          select: {
            proposalScore: true,
            rating: { select: { rating: true } },
            speakerScoreRecords: { select: { teamResultPoints: true } },
            chairFeedbackRecords: { select: { rating: true } },
          },
          orderBy: [{ publishedAt: "desc" }, { proposalVersion: "desc" }],
          take: 1,
        },
      },
      orderBy: { sessionDate: "asc" },
      take: sessionIds && sessionIds.length > 0 ? undefined : 10,
    });

    type HistoricalSession = (typeof sessions)[number];

    return sessions.map((session: HistoricalSession) => {
      const baselineProposal = session.pairingProposals[0] ?? null;
      return {
        sessionId: session.id,
        sessionDate: session.sessionDate.toISOString(),
        motionType: session.motionType ?? session.motiontype,
        motionText: session.motionText ?? "",
        pairingObjective: (session.pairingObjective ?? "BALANCED") as HistoricalReplayRecord["pairingObjective"],
        participantsPresent: session.attendance.map((entry: HistoricalSession["attendance"][number]) => resolveParticipantId(entry)).filter(Boolean),
        sessionRoles: session.sessionRoleAssignments.map((assignment: HistoricalSession["sessionRoleAssignments"][number]) => ({
          participantId: resolveParticipantId(assignment),
          role: assignment.role,
          isChair: assignment.isChair,
        })),
        actualPublishedProposalScore: baselineProposal?.proposalScore ?? null,
        adminPairingRating: baselineProposal?.rating?.rating ?? null,
        averageTeamResultPoints: baselineProposal?.speakerScoreRecords.length
          ? baselineProposal.speakerScoreRecords.reduce((sum: number, record: { teamResultPoints: number }) => sum + record.teamResultPoints, 0) / baselineProposal.speakerScoreRecords.length
          : null,
        averageChairFeedback: baselineProposal?.chairFeedbackRecords.length
          ? baselineProposal.chairFeedbackRecords.reduce((sum: number, record: { rating: number }) => sum + record.rating, 0) / baselineProposal.chairFeedbackRecords.length
          : null,
      };
    });
  }

  async function upsertEvalScenarios(scenarios: EvalScenarioRecordInput[]) {
    const records = [];
    for (const scenario of scenarios) {
      const record = await client.evalScenario.upsert({
        where: { name: scenario.name },
        update: {
          scenarioType: scenario.scenarioType,
          inputJson: scenario.inputJson,
          expectedSignalsJson: scenario.expectedSignalsJson,
        },
        create: {
          scenarioType: scenario.scenarioType,
          name: scenario.name,
          inputJson: scenario.inputJson,
          expectedSignalsJson: scenario.expectedSignalsJson,
        },
        select: { id: true, name: true },
      });
      records.push(record);
    }
    return records;
  }

  async function createEvalRunRecord(input: { engineVersion: string; ruleVersion: string; runType: string }) {
    return client.evalRun.create({
      data: {
        engineVersion: input.engineVersion,
        ruleVersion: input.ruleVersion,
        runType: input.runType,
        startedAt: new Date(),
        summaryJson: {},
        resultStatus: "RUNNING",
      },
      select: { id: true },
    });
  }

  async function finalizeEvalRunRecord(input: {
    evalRunId: string;
    summaryJson: Record<string, unknown>;
    resultStatus: string;
  }) {
    return client.evalRun.update({
      where: { id: input.evalRunId },
      data: {
        completedAt: new Date(),
        summaryJson: input.summaryJson,
        resultStatus: input.resultStatus,
      },
    });
  }

  async function createEvalScenarioResultRecords(input: { evalRunId: string; scenarios: EvalScenarioAggregate[]; scenarioIdsByName: Map<string, string> }) {
    if (input.scenarios.length === 0) {
      return { count: 0 };
    }

    return client.evalScenarioResult.createMany({
      data: input.scenarios
        .map((scenario) => {
          const scenarioId = input.scenarioIdsByName.get(scenario.name);
          if (!scenarioId) {
            return null;
          }
          return {
            evalRunId: input.evalRunId,
            scenarioId,
            validityJson: { validProposalRate: scenario.validProposalRate },
            qualityJson: {
              averageProposalScore: scenario.averageProposalScore,
              averageRoomBalanceScore: scenario.averageRoomBalanceScore,
              repeatPartnerRate: scenario.repeatPartnerRate,
              internalRoleRepetitionRate: scenario.internalRoleRepetitionRate,
              chairAssignmentQualityScore: scenario.chairAssignmentQualityScore,
              scoreVariance: scenario.scoreVariance,
              baselineProposalScore: scenario.baselineProposalScore,
            },
            recommendation: scenario.recommendation,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null),
    });
  }

  async function getMetricDefinitionsWithAdjustments() {
    const rows = await client.pairingMetricDefinition.findMany({
      select: {
        key: true,
        adjustments: {
          select: { currentAdjustment: true },
          orderBy: { lastUpdatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { key: "asc" },
    });

    type MetricDefinitionRow = (typeof rows)[number];

    return rows.map((row: MetricDefinitionRow) => ({ key: row.key, currentAdjustment: row.adjustments[0]?.currentAdjustment ?? 0 }));
  }

  async function getTuningWindowDataset(window: TuningWindowInput) {
    const [startSession, endSession] = await Promise.all([
      client.debateSession.findUnique({ where: { id: window.windowStartSessionId }, select: { sessionDate: true } }),
      client.debateSession.findUnique({ where: { id: window.windowEndSessionId }, select: { sessionDate: true } }),
    ]);

    if (!startSession || !endSession) {
      return [];
    }

    return client.debateSession.findMany({
      where: {
        sessionDate: {
          gte: startSession.sessionDate,
          lte: endSession.sessionDate,
        },
        publishedProposalId: { not: null },
      },
      select: {
        id: true,
        publishedProposal: {
          select: {
            id: true,
            proposalScore: true,
            rating: { select: { rating: true } },
            speakerScoreRecords: { select: { teamResultPoints: true } },
            chairFeedbackRecords: { select: { rating: true } },
          },
        },
      },
      orderBy: { sessionDate: "asc" },
    });
  }

  async function createTuningReviewWindowRecord(input: {
    windowStartSessionId: string;
    windowEndSessionId: string;
    sessionCount: number;
    analysisJson: Record<string, unknown>;
    status: string;
  }) {
    return client.tuningReviewWindow.create({
      data: {
        windowStartSessionId: input.windowStartSessionId,
        windowEndSessionId: input.windowEndSessionId,
        sessionCount: input.sessionCount,
        analysisJson: input.analysisJson,
        status: input.status,
      },
      select: { id: true },
    });
  }

  async function getEvalReportData(evalRunId: string) {
    const run = await client.evalRun.findUnique({
      where: { id: evalRunId },
      select: {
        id: true,
        engineVersion: true,
        ruleVersion: true,
        summaryJson: true,
      },
    });

    if (!run) {
      return null;
    }

    const results = await client.evalScenarioResult.findMany({
      where: { evalRunId },
      select: {
        scenarioId: true,
        validityJson: true,
        qualityJson: true,
        recommendation: true,
      },
    });

    const scenarioIds = results.map((result: { scenarioId: string }) => result.scenarioId);
    const scenarios = scenarioIds.length === 0
      ? []
      : await client.evalScenario.findMany({
          where: { id: { in: scenarioIds } },
          select: {
            id: true,
            scenarioType: true,
            name: true,
          },
        });

    const scenarioById = new Map(scenarios.map((scenario: { id: string; scenarioType: string; name: string }) => [scenario.id, scenario]));
    const summary = (run.summaryJson as { summary?: Record<string, unknown>; recommendation?: string })?.summary ?? {};
    const recommendation = ((run.summaryJson as { recommendation?: string })?.recommendation ?? "safe_to_keep") as EvalScenarioAggregate["recommendation"];

    return {
      evalRunId: run.id,
      engineVersion: run.engineVersion,
      ruleVersion: run.ruleVersion,
      baselineVersion: null,
      scenarios: results.map((result: { scenarioId: string; validityJson: unknown; qualityJson: unknown; recommendation: string }) => {
        const scenario = scenarioById.get(result.scenarioId) as { id: string; scenarioType: string; name: string } | undefined;
        const validity = (result.validityJson ?? {}) as { validProposalRate?: number };
        const quality = (result.qualityJson ?? {}) as Record<string, number | null>;
        return {
          scenarioId: result.scenarioId,
          scenarioType: (scenario?.scenarioType === "synthetic" ? "synthetic" : "historical") as EvalScenarioAggregate["scenarioType"],
          name: scenario?.name ?? result.scenarioId,
          runCount: 1,
          validProposalRate: validity.validProposalRate ?? 0,
          averageProposalScore: quality.averageProposalScore ?? 0,
          averageRoomBalanceScore: quality.averageRoomBalanceScore ?? 0,
          repeatPartnerRate: quality.repeatPartnerRate ?? 0,
          internalRoleRepetitionRate: quality.internalRoleRepetitionRate ?? 0,
          chairAssignmentQualityScore: quality.chairAssignmentQualityScore ?? 0,
          scoreVariance: quality.scoreVariance ?? 0,
          baselineProposalScore: quality.baselineProposalScore ?? null,
          recommendation: result.recommendation as EvalScenarioAggregate["recommendation"],
        };
      }),
      summary: {
        validProposalRate: Number(summary.validProposalRate ?? 0),
        averageRoomBalanceScore: Number(summary.averageRoomBalanceScore ?? 0),
        repeatPartnerRate: Number(summary.repeatPartnerRate ?? 0),
        internalRoleRepetitionRate: Number(summary.internalRoleRepetitionRate ?? 0),
        chairAssignmentQualityScore: Number(summary.chairAssignmentQualityScore ?? 0),
        qualityDelta: Number(summary.qualityDelta ?? 0),
        validityDelta: Number(summary.validityDelta ?? 0),
        stabilityDelta: Number(summary.stabilityDelta ?? 0),
        overallResult: (summary.overallResult ?? "WARN") as "PASS" | "WARN" | "FAIL",
      },
      recommendation,
    };
  }

  async function createMetricAdjustmentHistoryRecords(windowId: string, suggestions: MetricAdjustmentSuggestion[]) {    if (suggestions.length === 0) {
      return { count: 0 };
    }

    const definitions = await client.pairingMetricDefinition.findMany({
      where: { key: { in: suggestions.map((suggestion) => suggestion.metricKey) } },
      select: { id: true, key: true },
    });

    type MetricDefinition = (typeof definitions)[number];

    const idByKey = new Map(definitions.map((definition: MetricDefinition) => [definition.key, definition.id]));

    return client.metricAdjustmentHistory.createMany({
      data: suggestions
        .map((suggestion) => {
          const metricDefinitionId = idByKey.get(suggestion.metricKey);
          if (!metricDefinitionId) {
            return null;
          }
          return {
            metricDefinitionId,
            oldAdjustment: suggestion.currentAdjustment,
            newAdjustment: suggestion.suggestedAdjustment,
            reason: suggestion.reason,
            tuningWindowId: windowId,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null),
    });
  }

  return {
    getHistoricalReplayDataset,
    upsertEvalScenarios,
    createEvalRunRecord,
    finalizeEvalRunRecord,
    createEvalScenarioResultRecords,
    getMetricDefinitionsWithAdjustments,
    getEvalReportData,
    getTuningWindowDataset,
    createTuningReviewWindowRecord,
    createMetricAdjustmentHistoryRecords,
  };
}

export const evalRepository = createEvalRepository();






