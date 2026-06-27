import test from "node:test";
import assert from "node:assert/strict";

import { createPairingRepository } from "./pairing-repository.ts";
import type { PersistGeneratedProposalInput } from "../pairing/types.ts";

test("getGenerationContext uses explicit projections and shapes participants", async () => {
  const mockClient = {
    debateSession: {
      findUnique: async (args: Record<string, unknown>) => {
        assert.ok(args.select);
        assert.equal("include" in args, false);

        return {
          id: "session-1",
          motionType: "BP",
          motiontype: "BP",
          motionText: "This house would...",
          pairingObjective: "BALANCED",
          attendance: [
            {
              memberId: "member-1",
              cabinetId: null,
              presidentId: null,
              member: { id: "member-1", name: "Alice" },
              cabinet: null,
              president: null,
            },
          ],
          sessionRoleAssignments: [
            {
              memberId: "member-1",
              cabinetId: null,
              presidentId: null,
              role: "speaker",
              isChair: false,
            },
          ],
        };
      },
    },
    memberMetricSnapshot: {
      findMany: async () => [
        {
          memberId: "member-1",
          cabinetId: null,
          presidentId: null,
          metricKey: "speaker_strength",
          contextKey: null,
          value: 0.82,
          observationCount: 4,
          confidence: 0.8,
        },
      ],
    },
    pairMetricSnapshot: {
      findMany: async () => [],
    },
    speakerScoreRecord: {
      findMany: async (args: Record<string, unknown>) => {
        assert.ok(args.select);
        return [];
      },
    },
  };

  const repository = createPairingRepository(mockClient as never);
  const context = await repository.getGenerationContext("session-1");

  assert.equal(context.session.sessionId, "session-1");
  assert.equal(context.participants.length, 1);
  assert.deepEqual(context.participants[0], {
    participantId: "member-1",
    participantKind: "member",
    name: "Alice",
    academicYear: null,
    sessionRole: "speaker",
    isChairEligible: false,
  });
  assert.equal(context.memberMetricsById.get("member-1")?.metricKey, "speaker_strength");
});

test("publishProposalTransaction wraps publish state changes in one transaction", async () => {
  const calls: string[] = [];

  const tx = {
    pairingProposal: {
      findFirst: async () => ({ id: "proposal-1" }),
      update: async () => {
        calls.push("pairingProposal.update");
        return { id: "proposal-1" };
      },
      findUnique: async () => ({
        id: "proposal-1",
        sessionId: "session-1",
        proposalVersion: 1,
        status: "PUBLISHED",
        engineVersion: "v1",
        ruleVersion: "r1",
        topBandRank: 1,
        proposalScore: 91,
        scoreBreakdownJson: {},
        generatedAt: new Date("2026-01-01T00:00:00.000Z"),
        generatedBy: "member-1",
        approvedAt: new Date("2026-01-01T00:01:00.000Z"),
        publishedAt: new Date("2026-01-01T00:02:00.000Z"),
        isPublishedOfficially: true,
        roomAssignments: [],
        unassignedParticipants: [],
        reviewLogs: [],
      }),
    },
    debateSession: {
      update: async () => {
        calls.push("debateSession.update");
        return { id: "session-1" };
      },
      findUnique: async () => ({
        id: "session-1",
        motionType: "BP",
        motiontype: "BP",
        motionText: "This house would...",
        publishedAt: new Date("2026-01-01T00:02:00.000Z"),
        publishedProposalId: "proposal-1",
      }),
    },
    attendance: {
      updateMany: async () => {
        calls.push("attendance.updateMany");
        return { count: 1 };
      },
    },
  };

  const mockClient = {
    $transaction: async (callback: (transactionClient: typeof tx) => Promise<unknown>) => {
      calls.push("$transaction");
      return callback(tx);
    },
  };

  const repository = createPairingRepository(mockClient as never);
  const published = await repository.publishProposalTransaction({ sessionId: "session-1" });

  assert.deepEqual(calls, [
    "$transaction",
    "pairingProposal.update",
    "debateSession.update",
    "attendance.updateMany",
  ]);
  assert.equal(published.sessionId, "session-1");
  assert.equal(published.proposalId, "proposal-1");
});

test("saveGeneratedProposal persists audit metadata in the proposal payload", async () => {
  let createdData: Record<string, unknown> | null = null;

  const tx = {
    pairingProposal: {
      findFirst: async () => ({ proposalVersion: 1 }),
      create: async (args: Record<string, unknown>) => {
        createdData = args.data as Record<string, unknown>;
        return { id: "proposal-2" };
      },
      findUnique: async () => ({
        id: "proposal-2",
        sessionId: "session-1",
        proposalVersion: 2,
        status: "GENERATED",
        engineVersion: "pairing-engine-v1",
        ruleVersion: "pairing-rules-v1",
        topBandRank: 1,
        proposalScore: 0.88,
        scoreBreakdownJson: createdData ? (createdData["scoreBreakdownJson"] as unknown) : {},
        generatedAt: new Date("2026-01-01T00:00:00.000Z"),
        generatedBy: "cabinet-1",
        approvedAt: null,
        publishedAt: null,
        isPublishedOfficially: false,
        roomAssignments: [],
        unassignedParticipants: [],
        reviewLogs: [],
      }),
    },
    debateSession: {
      update: async () => ({ id: "session-1" }),
    },
  };

  const mockClient = {
    $transaction: async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx),
  };

  const repository = createPairingRepository(mockClient as never);
  const input: PersistGeneratedProposalInput = {
    sessionId: "session-1",
    generatedBy: "cabinet-1",
    candidate: {
      rooms: [],
      unassignedParticipants: [],
      proposalScore: 0.88,
      scoreBreakdown: {
        roomBalanceScore: 0.9,
        adjudicatorAverageScore: 0.8,
        chairScore: 0.85,
        teamQualityAggregate: 0.75,
        experienceDistributionAggregate: 0.7,
        totalProposalScore: 0.88,
      },
    },
    participantKindsById: new Map(),
    audit: {
      seed: 12345,
      selectedRank: 1,
      selectedProbability: 0.3,
      topBandSize: 5,
      engineVersion: "pairing-engine-v1",
      ruleVersion: "pairing-rules-v1",
      metricSnapshotVersion: "metrics-v1",
      objective: "BALANCED",
    },
  };

  const proposal = await repository.saveGeneratedProposal(input);
  const scoreBreakdownJson = (createdData?.["scoreBreakdownJson"] ?? {}) as { audit?: Record<string, unknown> };

  assert.equal(scoreBreakdownJson.audit?.metricSnapshotVersion, "metrics-v1");
  assert.equal(scoreBreakdownJson.audit?.finalSelectionProbability, 0.3);
  assert.equal(scoreBreakdownJson.audit?.randomSeed, 12345);
  assert.equal(scoreBreakdownJson.audit?.objective, "BALANCED");
  assert.equal(proposal.summary.version, 2);
});

