import test from "node:test";
import assert from "node:assert/strict";

import type {
  MemberMetricSnapshot,
  PairMetricSnapshot,
  PairingProposalView,
  ParticipantContext,
  ProposalScoreBreakdown,
} from "../../../types/pairing.ts";
import { createPairingEngine } from "./engine.ts";
import { scoreProposal } from "./proposal-scorer.ts";
import type {
  PairingCandidate,
  PersistGeneratedProposalInput,
  PreparedScoringContext,
  ScoredPairingCandidate,
  SelectionResult,
} from "./types.ts";

function buildMemberSnapshots(participantId: string): MemberMetricSnapshot[] {
  return [
    { participantId, metricKey: "speaker_total_score", contextKey: null, value: 0.7, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "speaker_motion_type_score", contextKey: "IR", value: 0.72, observationCount: 5, confidence: 1 },
    { participantId, metricKey: "speaker_strength", contextKey: null, value: 0.74, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "bp_position_history", contextKey: "OG", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "bp_position_history", contextKey: "OO", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "bp_position_history", contextKey: "CG", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "bp_position_history", contextKey: "CO", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "internal_speaking_role_history", contextKey: "PM", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "internal_speaking_role_history", contextKey: "DPM", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "internal_speaking_role_history", contextKey: "LO", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "internal_speaking_role_history", contextKey: "DLO", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "internal_speaking_role_history", contextKey: "MG", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "internal_speaking_role_history", contextKey: "GW", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "internal_speaking_role_history", contextKey: "MO", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "internal_speaking_role_history", contextKey: "OW", value: 0.5, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "role_score", contextKey: "PM", value: 0.64, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "role_score", contextKey: "DPM", value: 0.64, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "role_score", contextKey: "LO", value: 0.64, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "role_score", contextKey: "DLO", value: 0.64, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "role_score", contextKey: "MG", value: 0.64, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "role_score", contextKey: "GW", value: 0.64, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "role_score", contextKey: "MO", value: 0.64, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "role_score", contextKey: "OW", value: 0.64, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "motion_type_x_role_score", contextKey: "IR:PM", value: 0.68, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "motion_type_x_role_score", contextKey: "IR:DPM", value: 0.68, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "motion_type_x_role_score", contextKey: "IR:LO", value: 0.68, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "motion_type_x_role_score", contextKey: "IR:DLO", value: 0.68, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "motion_type_x_role_score", contextKey: "IR:MG", value: 0.68, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "motion_type_x_role_score", contextKey: "IR:GW", value: 0.68, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "motion_type_x_role_score", contextKey: "IR:MO", value: 0.68, observationCount: 6, confidence: 1 },
    { participantId, metricKey: "motion_type_x_role_score", contextKey: "IR:OW", value: 0.68, observationCount: 6, confidence: 1 },
  ];
}

function buildPairSnapshots(firstParticipantId: string, secondParticipantId: string): PairMetricSnapshot[] {
  const pairKey = [firstParticipantId, secondParticipantId].sort().join("::");
  return [
    { pairKey, memberAId: firstParticipantId, memberBId: secondParticipantId, metricKey: "partner_dynamics_overall", contextKey: null, value: 0.58, observationCount: 5, confidence: 1 },
    { pairKey, memberAId: firstParticipantId, memberBId: secondParticipantId, metricKey: "partner_dynamics_by_motion_type", contextKey: "IR", value: 0.61, observationCount: 5, confidence: 1 },
    { pairKey, memberAId: firstParticipantId, memberBId: secondParticipantId, metricKey: "repeat_partner_penalty", contextKey: null, value: 0.2, observationCount: 5, confidence: 1 },
  ];
}

function buildContext(): PreparedScoringContext {
  const speakers: ParticipantContext[] = Array.from({ length: 8 }, (_, index) => ({
    participantId: `speaker-${index + 1}`,
    participantKind: "member",
    name: `Speaker ${index + 1}`,
    academicYear: null,
    sessionRole: "speaker",
    isChairEligible: false,
  }));
  const adjudicator: ParticipantContext = {
    participantId: "adj-1",
    participantKind: "member",
    name: "Adj 1",
    academicYear: null,
    sessionRole: "adjudicator",
    isChairEligible: true,
  };

  const memberSnapshots = new Map<string, Map<string, MemberMetricSnapshot>>();
  for (const participant of speakers) {
    memberSnapshots.set(
      participant.participantId,
      new Map(buildMemberSnapshots(participant.participantId).map((snapshot) => [`${snapshot.metricKey}:${snapshot.contextKey ?? ""}`, snapshot])),
    );
  }

  const pairSnapshots = new Map<string, Map<string, PairMetricSnapshot>>();
  const teams = [
    ["speaker-1", "speaker-2"],
    ["speaker-3", "speaker-4"],
    ["speaker-5", "speaker-6"],
    ["speaker-7", "speaker-8"],
  ] as const;
  for (const [firstParticipantId, secondParticipantId] of teams) {
    const snapshots = buildPairSnapshots(firstParticipantId, secondParticipantId);
    pairSnapshots.set(
      [firstParticipantId, secondParticipantId].sort().join("::"),
      new Map(snapshots.map((snapshot) => [`${snapshot.metricKey}:${snapshot.contextKey ?? ""}`, snapshot])),
    );
  }

  return {
    session: {
      sessionId: "session-1",
      motionType: "IR",
      motionText: "THW do something",
      pairingObjective: "BALANCED",
    },
    participants: [...speakers, adjudicator],
    memberMetricsById: new Map(),
    pairMetricsByKey: new Map([...pairSnapshots.entries()].map(([pairKey, snapshots]) => [pairKey, snapshots.values().next().value as PairMetricSnapshot])),
    roleHistoryByMemberId: new Map(),
    motionTypeHistoryByMemberId: new Map(),
    adjudicatorMetricsById: new Map([["adj-1", { participantId: "adj-1", adjudicatorAverageScore: 0.77, chairScore: 0.81, confidence: 1 }]]),
    rules: {
      timeConstraintParticipantIds: [],
      forcedTeamUps: [],
      forcedSeparations: [],
      forcedChairParticipantId: null,
      forcedRoomCount: null,
    },
    memberMetricSnapshotsByParticipantId: memberSnapshots,
    pairMetricSnapshotsByPairKey: pairSnapshots,
    metricWeightsByKey: new Map([
      ["academic_year", 0.05],
      ["speaker_total_score", 0.22],
      ["speaker_motion_type_score", 0.18],
      ["speaker_strength", 0.12],
      ["partner_dynamics_overall", 0.12],
      ["partner_dynamics_by_motion_type", 0.10],
      ["repeat_partner_penalty", -0.09],
      ["bp_position_history", 0.07],
      ["internal_speaking_role_history", 0.07],
      ["role_score", 0.04],
      ["motion_type_x_role_score", 0.03],
      ["room_balance_score", 0.40],
      ["adjudicator_average_score", 0.20],
      ["chair_score", 0.20],
      ["team_quality_aggregate", 0.12],
      ["experience_distribution_aggregate", 0.08],
    ]),
    metricSnapshotVersion: "metrics-v1",
  };
}

function buildCandidate(): PairingCandidate {
  return {
    rooms: [
      {
        roomIndex: 1,
        roomScore: null,
        roomBalanceScore: null,
        roomDifficultyScore: 1,
        teams: [
          { bpPosition: "OG", teamScore: null, speakers: [{ participantId: "speaker-1", speakingRole: "PM" }, { participantId: "speaker-2", speakingRole: "DPM" }] },
          { bpPosition: "OO", teamScore: null, speakers: [{ participantId: "speaker-3", speakingRole: "LO" }, { participantId: "speaker-4", speakingRole: "DLO" }] },
          { bpPosition: "CG", teamScore: null, speakers: [{ participantId: "speaker-5", speakingRole: "MG" }, { participantId: "speaker-6", speakingRole: "GW" }] },
          { bpPosition: "CO", teamScore: null, speakers: [{ participantId: "speaker-7", speakingRole: "MO" }, { participantId: "speaker-8", speakingRole: "OW" }] },
        ],
        adjudicators: [{ participantId: "adj-1", isChair: true, chairAssignmentScore: 0.8 }],
      },
    ],
    unassignedParticipants: [],
  };
}

function buildGeneratedProposalView(scoreBreakdown: ProposalScoreBreakdown): PairingProposalView {
  return {
    summary: {
      proposalId: "proposal-1",
      sessionId: "session-1",
      version: 1,
      status: "GENERATED",
      engineVersion: "pairing-engine-v1",
      ruleVersion: "pairing-rules-v1",
      topBandRank: 1,
      proposalScore: scoreBreakdown.totalProposalScore,
      scoreBreakdown,
      generatedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
      generatedBy: "cabinet-1",
      approvedAt: null,
      publishedAt: null,
      isPublishedOfficially: false,
    },
    rooms: [],
    unassignedParticipants: [],
    reviewState: {
      isApproved: false,
      isPublished: false,
      lastAction: null,
    },
  };
}

test("scoreProposal is deterministic for fixed candidate and context", () => {
  const context = buildContext();
  const candidate = buildCandidate();

  const first = scoreProposal(candidate, context);
  const second = scoreProposal(candidate, context);

  assert.equal(first.proposalScore, second.proposalScore);
  assert.deepEqual(first.scoreBreakdown, second.scoreBreakdown);
  assert.deepEqual(first.rooms, second.rooms);
});

test("generatePairingProposal persists audit metadata on successful generation", async () => {
  const context = buildContext();
  const candidate = buildCandidate();
  const scoredCandidate = scoreProposal(candidate, context);
  let persistedInput: PersistGeneratedProposalInput | null = null;

  const repository = {
    getGenerationContext: async () => context,
    saveGeneratedProposal: async (input: PersistGeneratedProposalInput) => {
      persistedInput = input;
      return buildGeneratedProposalView(input.candidate.scoreBreakdown);
    },
  };

  const metricRepository = {
    getMemberMetricSnapshots: async () => [...context.memberMetricSnapshotsByParticipantId.values()].flatMap((snapshots) => [...snapshots.values()]),
    getPairMetricSnapshots: async () => [...context.pairMetricSnapshotsByPairKey.values()].flatMap((snapshots) => [...snapshots.values()]),
  };

  const metricsLoader = {
    loadPairingMetrics: async () => ({
      version: "metrics-v1",
      definitions: [...context.metricWeightsByKey.entries()].map(([key, baseWeight]) => ({ key, baseWeight, isEnabled: true, isSoftRule: true })),
      adjustmentsByMetricKey: new Map<string, number>(),
    }),
    loadSessionInputs: async () => ({
      objective: context.session.pairingObjective,
      rules: context.rules,
    }),
  };

  const dependencies = {
    generateCandidateProposals: () => [candidate],
    isCandidateValid: () => true,
    validateHardRules: () => ({ isValid: true, violations: [] }),
    scoreProposal: () => scoredCandidate,
    selectProposalFromTopBand: () => ({
      candidate: scoredCandidate,
      audit: { seed: 12345, selectedRank: 1, selectedProbability: 0.3, topBandSize: 1 },
    } satisfies SelectionResult),
  };

  const engine = createPairingEngine(repository, metricRepository, metricsLoader, dependencies);
  const result = await engine.generatePairingProposal({ sessionId: "session-1", generatedBy: "cabinet-1", seed: 12345 });

  assert.equal(result.ok, true);
  if (!persistedInput) {
    throw new Error("Expected the generated proposal to be persisted.");
  }
  const persisted = persistedInput as PersistGeneratedProposalInput;
  assert.equal(persisted.audit.seed, 12345);
  assert.equal(persisted.audit.selectedProbability, 0.3);
  assert.equal(persisted.audit.metricSnapshotVersion, "metrics-v1");
  assert.equal(persisted.audit.objective, "BALANCED");
});

test("generatePairingProposal returns a typed NO_VALID_PROPOSAL failure when all candidates are invalid", async () => {
  const context = buildContext();
  const candidate = buildCandidate();

  const engine = createPairingEngine(
    {
      getGenerationContext: async () => context,
      saveGeneratedProposal: async () => buildGeneratedProposalView({
        roomBalanceScore: 0,
        adjudicatorAverageScore: 0,
        chairScore: 0,
        teamQualityAggregate: 0,
        experienceDistributionAggregate: 0,
        totalProposalScore: 0,
      }),
    },
    {
      getMemberMetricSnapshots: async () => [],
      getPairMetricSnapshots: async () => [],
    },
    {
      loadPairingMetrics: async () => ({
        version: "metrics-v1",
        definitions: [],
        adjustmentsByMetricKey: new Map(),
      }),
      loadSessionInputs: async () => ({
        objective: context.session.pairingObjective,
        rules: context.rules,
      }),
    },
    {
      generateCandidateProposals: () => [candidate],
      isCandidateValid: () => false,
      validateHardRules: () => ({
        isValid: false,
        violations: [{ code: "MISSING_CHAIR", message: "Each room must have exactly one chair." }],
      }),
      scoreProposal: () => ({ ...candidate, proposalScore: 0, scoreBreakdown: { roomBalanceScore: 0, adjudicatorAverageScore: 0, chairScore: 0, teamQualityAggregate: 0, experienceDistributionAggregate: 0, totalProposalScore: 0 } } as ScoredPairingCandidate),
      selectProposalFromTopBand: () => {
        throw new Error("selection should not run when no valid proposal exists");
      },
    },
  );

  const result = await engine.generatePairingProposal({ sessionId: "session-1", seed: 7 });

  assert.deepEqual(result, {
    ok: false,
    reason: "NO_VALID_PROPOSAL",
    detail: "All generated candidates violated hard rules.",
    violations: [{ code: "MISSING_CHAIR", message: "Each room must have exactly one chair." }],
  });
});

