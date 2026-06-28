import type { PairingProposalView } from "../../../types/pairing.ts";
import { createPairingEngine } from "../pairing/engine.ts";
import type { GeneratePairingProposalInput, PersistGeneratedProposalInput } from "../pairing/types.ts";
import { pairingRepository } from "../repositories/pairing-repository.ts";
import { evalRepository } from "../repositories/eval-repository.ts";
import { getSyntheticPairingScenarios } from "./synthetic-scenarios.ts";
import type {
  EvalScenarioAggregate,
  EvalScenarioDefinition,
  HistoricalReplayInput,
  HistoricalReplayRecord,
  ReplayExecutionResult,
  SyntheticReplayInput,
} from "./types.ts";

interface ReplayRepositoryContract {
  getHistoricalReplayDataset(sessionIds?: string[], baselineVersion?: string | null): Promise<HistoricalReplayRecord[]>;
}

interface ReplayGeneratorContract {
  generatePairingProposal(input: GeneratePairingProposalInput): Promise<
    | { ok: true; proposal: PairingProposalView; audit: { engineVersion: string; ruleVersion: string } }
    | { ok: false; reason: string; detail: string }
  >;
}

function buildEvalProposalView(input: PersistGeneratedProposalInput): PairingProposalView {
  return {
    summary: {
      proposalId: `eval-${input.sessionId}-${input.audit.seed}`,
      sessionId: input.sessionId,
      version: 0,
      status: "GENERATED",
      engineVersion: input.audit.engineVersion,
      ruleVersion: input.audit.ruleVersion,
      topBandRank: input.audit.selectedRank,
      proposalScore: input.candidate.proposalScore,
      scoreBreakdown: input.candidate.scoreBreakdown,
      generatedAt: new Date().toISOString(),
      generatedBy: input.generatedBy,
      approvedAt: null,
      publishedAt: null,
      isPublishedOfficially: false,
    },
    rooms: input.candidate.rooms.map((room) => ({
      roomIndex: room.roomIndex,
      roomScore: room.roomScore,
      roomBalanceScore: room.roomBalanceScore,
      roomDifficultyScore: room.roomDifficultyScore,
      teams: room.teams.map((team) => ({
        bpPosition: team.bpPosition,
        teamScore: team.teamScore,
        speakers: team.speakers.map((speaker) => ({ participantId: speaker.participantId, speakingRole: speaker.speakingRole })),
      })),
      adjudicators: room.adjudicators.map((adjudicator) => ({
        participantId: adjudicator.participantId,
        isChair: adjudicator.isChair,
        chairAssignmentScore: adjudicator.chairAssignmentScore,
      })),
    })),
    unassignedParticipants: input.candidate.unassignedParticipants,
    reviewState: {
      isApproved: false,
      isPublished: false,
      lastAction: null,
    },
  };
}

function createDryRunGenerator(): ReplayGeneratorContract {
  const engine = createPairingEngine(
    {
      getGenerationContext: pairingRepository.getGenerationContext,
      async saveGeneratedProposal(input: PersistGeneratedProposalInput) {
        return buildEvalProposalView(input);
      },
    },
  );

  return {
    generatePairingProposal: engine.generatePairingProposal,
  };
}

function parseScenarioSet(scenarioSet: string) {
  return scenarioSet === "default"
    ? []
    : scenarioSet.split(",").map((value) => value.trim()).filter(Boolean);
}

function computeVariance(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function computeRepeatPartnerRate(proposal: PairingProposalView) {
  const pairKeys = proposal.rooms.flatMap((room) =>
    room.teams.map((team) => team.speakers.map((speaker) => speaker.participantId).sort().join("::")),
  );
  if (pairKeys.length === 0) {
    return 0;
  }
  const uniqueCount = new Set(pairKeys).size;
  return (pairKeys.length - uniqueCount) / pairKeys.length;
}

function computeInternalRoleRepetitionRate(proposal: PairingProposalView) {
  const participantIds = proposal.rooms.flatMap((room) =>
    room.teams.flatMap((team) => team.speakers.map((speaker) => speaker.participantId)),
  );
  if (participantIds.length === 0) {
    return 0;
  }
  const uniqueCount = new Set(participantIds).size;
  return (participantIds.length - uniqueCount) / participantIds.length;
}

function computeChairAssignmentQualityScore(proposal: PairingProposalView) {
  const chairScores = proposal.rooms
    .flatMap((room) => room.adjudicators.filter((adjudicator) => adjudicator.isChair))
    .map((chair) => chair.chairAssignmentScore ?? 0);
  if (chairScores.length === 0) {
    return 0;
  }
  return chairScores.reduce((sum, score) => sum + score, 0) / chairScores.length;
}

function buildAggregate(
  scenario: EvalScenarioDefinition,
  proposalScores: number[],
  roomBalanceScores: number[],
  repeatRates: number[],
  internalRoleRates: number[],
  chairScores: number[],
  validCount: number,
  runCount: number,
  baselineProposalScore: number | null,
): EvalScenarioAggregate {
  const validProposalRate = runCount === 0 ? 0 : validCount / runCount;
  const average = (values: number[]) => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);
  const averageRoomBalanceScore = average(roomBalanceScores);
  const recommendation =
    validProposalRate < 1
      ? "regression_detected"
      : averageRoomBalanceScore >= 0.8
        ? "safe_to_keep"
        : averageRoomBalanceScore >= 0.7
          ? "safe_but_needs_review"
          : "regression_detected";

  return {
    scenarioId: scenario.scenarioId,
    scenarioType: scenario.scenarioType,
    name: scenario.name,
    runCount,
    validProposalRate,
    averageProposalScore: average(proposalScores),
    averageRoomBalanceScore,
    repeatPartnerRate: average(repeatRates),
    internalRoleRepetitionRate: average(internalRoleRates),
    chairAssignmentQualityScore: average(chairScores),
    scoreVariance: computeVariance(proposalScores),
    baselineProposalScore,
    recommendation,
  };
}

export async function runHistoricalReplay(
  input: HistoricalReplayInput,
  repository: ReplayRepositoryContract = evalRepository,
  generator: ReplayGeneratorContract = createDryRunGenerator(),
): Promise<ReplayExecutionResult> {
  const requestedSessionIds = parseScenarioSet(input.scenarioSet);
  const scenarios = await repository.getHistoricalReplayDataset(requestedSessionIds, input.baselineVersion);

  const aggregates: EvalScenarioAggregate[] = [];
  let engineVersion = "pairing-engine-v1";
  let ruleVersion = "pairing-rules-v1";

  for (const scenarioRecord of scenarios) {
    const scenario: EvalScenarioDefinition = {
      scenarioId: `historical-${scenarioRecord.sessionId}`,
      scenarioType: "historical",
      name: `Historical ${scenarioRecord.sessionId}`,
      difficulty: "historical",
      sessionId: scenarioRecord.sessionId,
      inputJson: { sessionId: scenarioRecord.sessionId },
      expectedSignalsJson: null,
    };

    const proposalScores: number[] = [];
    const roomBalanceScores: number[] = [];
    const repeatRates: number[] = [];
    const internalRoleRates: number[] = [];
    const chairScores: number[] = [];
    let validCount = 0;

    for (let runIndex = 0; runIndex < input.runsPerScenario; runIndex += 1) {
      const seed = (runIndex + 1) * 1000 + aggregates.length;
      const result = await generator.generatePairingProposal({ sessionId: scenarioRecord.sessionId, seed });
      if (!result.ok) {
        continue;
      }
      validCount += 1;
      engineVersion = result.audit.engineVersion;
      ruleVersion = result.audit.ruleVersion;
      proposalScores.push(result.proposal.summary.proposalScore);
      roomBalanceScores.push(result.proposal.summary.scoreBreakdown.roomBalanceScore);
      repeatRates.push(computeRepeatPartnerRate(result.proposal));
      internalRoleRates.push(computeInternalRoleRepetitionRate(result.proposal));
      chairScores.push(computeChairAssignmentQualityScore(result.proposal));
    }

    aggregates.push(
      buildAggregate(
        scenario,
        proposalScores,
        roomBalanceScores,
        repeatRates,
        internalRoleRates,
        chairScores,
        validCount,
        input.runsPerScenario,
        scenarioRecord.actualPublishedProposalScore,
      ),
    );
  }

  return {
    engineVersion,
    ruleVersion,
    baselineVersion: input.baselineVersion,
    scenarios: aggregates,
  };
}

export async function runSyntheticReplay(
  input: SyntheticReplayInput,
  _repository: ReplayRepositoryContract = evalRepository,
  generator?: ReplayGeneratorContract,
): Promise<ReplayExecutionResult> {
  const scenarios = input.scenarios ?? getSyntheticPairingScenarios();
  const aggregates: EvalScenarioAggregate[] = [];

  for (const scenario of scenarios) {
    if (!generator || !scenario.sessionId) {
      aggregates.push({
        scenarioId: scenario.scenarioId,
        scenarioType: scenario.scenarioType,
        name: scenario.name,
        runCount: input.runsPerScenario,
        validProposalRate: 0,
        averageProposalScore: 0,
        averageRoomBalanceScore: 0,
        repeatPartnerRate: 0,
        internalRoleRepetitionRate: 0,
        chairAssignmentQualityScore: 0,
        scoreVariance: 0,
        baselineProposalScore: null,
        recommendation: "insufficient_data",
      });
      continue;
    }

    const result = await runHistoricalReplay(
      {
        scenarioSet: scenario.sessionId,
        runsPerScenario: input.runsPerScenario,
        baselineVersion: input.baselineVersion,
      },
      {
        async getHistoricalReplayDataset() {
          return [
            {
              sessionId: scenario.sessionId!,
              sessionDate: new Date().toISOString(),
              motionType: String(scenario.inputJson.objective ?? "BALANCED"),
              motionText: scenario.name,
              pairingObjective: "BALANCED",
              participantsPresent: [],
              sessionRoles: [],
              actualPublishedProposalScore: null,
              adminPairingRating: null,
              averageTeamResultPoints: null,
              averageChairFeedback: null,
            },
          ];
        },
      },
      generator,
    );
    aggregates.push(...result.scenarios);
  }

  return {
    engineVersion: "pairing-engine-v1",
    ruleVersion: "pairing-rules-v1",
    baselineVersion: input.baselineVersion,
    scenarios: aggregates,
  };
}
