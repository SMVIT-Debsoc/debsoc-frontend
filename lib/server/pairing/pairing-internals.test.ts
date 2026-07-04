import test from "node:test";
import assert from "node:assert/strict";

import { computeConfidence, resolveMetricWithFallback } from "./fallback.ts";
import { computeRoomPlan, buildUnassignedParticipants } from "./leftovers.ts";
import { computeChairAssignmentScore, assignChairsToRooms } from "./chair-assignment.ts";
import { selectProposalFromTopBand } from "./proposal-selector.ts";
import { generateCandidateProposals } from "./candidate-generator.ts";
import { validateHardRules } from "./hard-rules.ts";
import type { ParticipantContext, ProposalScoreBreakdown } from "../../../types/pairing.ts";
import type { PairingCandidate } from "./types.ts";

test("Fo2 and Fo3 confidence fallback handles zero observation and target saturation", () => {
  assert.equal(computeConfidence(0, 5), 0);
  assert.equal(computeConfidence(10, 5), 1);
  assert.equal(resolveMetricWithFallback({ observationCount: 0, targetCount: 5, specificMetric: 90, fallbackMetric: 42 }), 42);
  assert.equal(resolveMetricWithFallback({ observationCount: 5, targetCount: 5, specificMetric: 90, fallbackMetric: 42 }), 90);
});

test("Fo7 leftover handling computes room plan and unassigned speakers", () => {
  assert.deepEqual(computeRoomPlan(19), { roomCount: 2, leftoverSpeakerCount: 3 });
  const leftovers = buildUnassignedParticipants([
    {
      participantId: "member-1",
      participantKind: "member",
      name: "A",
      academicYear: null,
      sessionRole: "speaker",
      isChairEligible: false,
    },
  ] satisfies ParticipantContext[]);
  assert.deepEqual(leftovers, [{ participantId: "member-1", reason: "INSUFFICIENT_SPEAKERS_FOR_FULL_ROOM" }]);
});

test("Fo6 chair assignment score and strongest-chair-first allocation work", () => {
  assert.equal(computeChairAssignmentScore({ chairScore: 10, adjudicatorAverageScore: 8, chairConfidenceScore: 1 }), 8.15);
  const allocation = assignChairsToRooms({
    rooms: [
      { roomIndex: 1, roomDifficultyScore: 10 },
      { roomIndex: 2, roomDifficultyScore: 5 },
    ],
    adjudicators: [
      {
        participantId: "adj-1",
        participantKind: "member",
        name: "A",
        academicYear: null,
        sessionRole: "adjudicator",
        isChairEligible: true,
        metrics: { participantId: "adj-1", adjudicatorAverageScore: 6, chairScore: 8, confidence: 1 },
      },
      {
        participantId: "adj-2",
        participantKind: "member",
        name: "B",
        academicYear: null,
        sessionRole: "adjudicator",
        isChairEligible: true,
        metrics: { participantId: "adj-2", adjudicatorAverageScore: 5, chairScore: 6, confidence: 0.5 },
      },
      {
        participantId: "adj-3",
        participantKind: "member",
        name: "C",
        academicYear: null,
        sessionRole: "adjudicator",
        isChairEligible: true,
        metrics: { participantId: "adj-3", adjudicatorAverageScore: 4, chairScore: 5, confidence: 0.2 },
      },
    ],
  });

  assert.equal(allocation.roomChairs[0].participantId, "adj-1");
  assert.equal(allocation.roomChairs[0].roomIndex, 1);
  assert.equal(allocation.panelAssignments.length, 1);
});

test("Fo8 top-band selection normalizes probabilities and is deterministic by seed", () => {
  const scoreBreakdown: ProposalScoreBreakdown = {
    roomBalanceScore: 0,
    adjudicatorAverageScore: 0,
    chairScore: 0,
    teamQualityAggregate: 0,
    experienceDistributionAggregate: 0,
    totalProposalScore: 0,
  };
  const candidates = [100, 90, 80, 70, 60].map((proposalScore) => ({
    rooms: [],
    unassignedParticipants: [],
    proposalScore,
    scoreBreakdown,
  }));

  const first = selectProposalFromTopBand(candidates, { seed: 1234 });
  const second = selectProposalFromTopBand(candidates, { seed: 1234 });
  assert.equal(first.audit.topBandSize, 5);
  assert.equal(first.candidate.proposalScore, second.candidate.proposalScore);
  assert.ok(first.audit.selectedProbability > 0);
  assert.ok(first.audit.selectedProbability <= 1);
});

test("candidate generation keeps OG/OO/CG/CO order with correct role labels", () => {
  const candidates = generateCandidateProposals({
    session: {
      sessionId: "session-1",
      motionType: "IR",
      motionText: "THBT test motion",
      pairingObjective: "BALANCED",
    },
    participants: [
      { participantId: "speaker-1", participantKind: "member", name: "S1", academicYear: null, sessionRole: "speaker", isChairEligible: false },
      { participantId: "speaker-2", participantKind: "member", name: "S2", academicYear: null, sessionRole: "speaker", isChairEligible: false },
      { participantId: "speaker-3", participantKind: "member", name: "S3", academicYear: null, sessionRole: "speaker", isChairEligible: false },
      { participantId: "speaker-4", participantKind: "member", name: "S4", academicYear: null, sessionRole: "speaker", isChairEligible: false },
      { participantId: "speaker-5", participantKind: "member", name: "S5", academicYear: null, sessionRole: "speaker", isChairEligible: false },
      { participantId: "speaker-6", participantKind: "member", name: "S6", academicYear: null, sessionRole: "speaker", isChairEligible: false },
      { participantId: "speaker-7", participantKind: "member", name: "S7", academicYear: null, sessionRole: "speaker", isChairEligible: false },
      { participantId: "speaker-8", participantKind: "member", name: "S8", academicYear: null, sessionRole: "speaker", isChairEligible: false },
      { participantId: "adj-1", participantKind: "member", name: "A1", academicYear: null, sessionRole: "adjudicator", isChairEligible: true },
    ],
    memberMetricsById: new Map(),
    pairMetricsByKey: new Map(),
    roleHistoryByMemberId: new Map(),
    motionTypeHistoryByMemberId: new Map(),
    adjudicatorMetricsById: new Map([
      ["adj-1", { participantId: "adj-1", adjudicatorAverageScore: 5, chairScore: 7, confidence: 1 }],
    ]),
    rules: {
      timeConstraints: [],
      forcedTeamUps: [],
      forcedSeparations: [],
      forcedChairParticipantId: null,
      forcedRoomCount: null,
    },
  });

  assert.equal(candidates.length > 0, true);
  assert.deepEqual(
    candidates[0].rooms[0].teams.map((team) => ({
      bpPosition: team.bpPosition,
      roles: team.speakers.map((speaker) => speaker.speakingRole),
    })),
    [
      { bpPosition: "OG", roles: ["PM", "DPM"] },
      { bpPosition: "OO", roles: ["LO", "DLO"] },
      { bpPosition: "CG", roles: ["MG", "GW"] },
      { bpPosition: "CO", roles: ["MO", "OW"] },
    ],
  );
});

test("candidate generation places time-constrained speakers in early speaking roles when possible", () => {
  const participants: ParticipantContext[] = [
    { participantId: "speaker-1", participantKind: "member", name: "S1", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-2", participantKind: "member", name: "S2", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-3", participantKind: "member", name: "S3", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-4", participantKind: "member", name: "S4", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-5", participantKind: "member", name: "S5", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-6", participantKind: "member", name: "S6", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-7", participantKind: "member", name: "S7", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-8", participantKind: "member", name: "S8", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "adj-1", participantKind: "member", name: "A1", academicYear: null, sessionRole: "adjudicator", isChairEligible: true },
  ];
  const candidates = generateCandidateProposals({
    session: {
      sessionId: "session-1",
      motionType: "IR",
      motionText: "THBT test motion",
      pairingObjective: "BALANCED",
    },
    participants,
    memberMetricsById: new Map(),
    pairMetricsByKey: new Map(),
    roleHistoryByMemberId: new Map(),
    motionTypeHistoryByMemberId: new Map(),
    adjudicatorMetricsById: new Map([
      ["adj-1", { participantId: "adj-1", adjudicatorAverageScore: 5, chairScore: 7, confidence: 1 }],
    ]),
    rules: {
      timeConstraints: [{ participantId: "speaker-5", isStrict: false }],
      forcedTeamUps: [],
      forcedSeparations: [],
      forcedChairParticipantId: null,
      forcedRoomCount: null,
    },
  });
  const earlyRoles = new Set(["PM", "DPM", "LO", "DLO"]);

  assert.equal(candidates.length > 0, true);
  for (const candidate of candidates) {
    const assignment = candidate.rooms
      .flatMap((room) => room.teams.flatMap((team) => team.speakers))
      .find((speaker) => speaker.participantId === "speaker-5");
    assert.ok(assignment);
    assert.equal(earlyRoles.has(assignment.speakingRole), true);
  }
});

test("hard rules reject event team-up mismatch before top-band selection", () => {
  const participants: ParticipantContext[] = [
    { participantId: "speaker-1", participantKind: "member", name: "S1", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-2", participantKind: "member", name: "S2", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-3", participantKind: "member", name: "S3", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-4", participantKind: "member", name: "S4", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-5", participantKind: "member", name: "S5", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-6", participantKind: "member", name: "S6", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-7", participantKind: "member", name: "S7", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "speaker-8", participantKind: "member", name: "S8", academicYear: null, sessionRole: "speaker", isChairEligible: false },
    { participantId: "adj-1", participantKind: "member", name: "A1", academicYear: null, sessionRole: "adjudicator", isChairEligible: true },
  ];
  const candidate: PairingCandidate = {
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
        adjudicators: [{ participantId: "adj-1", isChair: true, chairAssignmentScore: 1 }],
      },
    ],
    unassignedParticipants: [],
  };

  const result = validateHardRules(candidate, {
    session: {
      sessionId: "session-1",
      motionType: "IR",
      motionText: "THBT test motion",
      pairingObjective: "BALANCED",
    },
    participants,
    memberMetricsById: new Map(),
    pairMetricsByKey: new Map(),
    roleHistoryByMemberId: new Map(),
    motionTypeHistoryByMemberId: new Map(),
    adjudicatorMetricsById: new Map(),
    rules: {
      timeConstraints: [],
      forcedTeamUps: [{ firstParticipantId: "speaker-1", secondParticipantId: "speaker-5", isStrict: false }],
      forcedSeparations: [],
      forcedChairParticipantId: null,
      forcedRoomCount: null,
    },
  });

  assert.equal(result.isValid, false);
  assert.equal(result.violations.some((violation) => violation.code === "FORCED_TEAM_UP_UNMET"), true);
});