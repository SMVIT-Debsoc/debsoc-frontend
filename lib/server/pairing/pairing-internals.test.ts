import test from "node:test";
import assert from "node:assert/strict";

import { computeConfidence, resolveMetricWithFallback } from "./fallback.ts";
import { computeRoomPlan, buildUnassignedParticipants } from "./leftovers.ts";
import { computeChairAssignmentScore, assignChairsToRooms } from "./chair-assignment.ts";
import { selectProposalFromTopBand } from "./proposal-selector.ts";
import type { ParticipantContext, ProposalScoreBreakdown } from "../../../types/pairing.ts";

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