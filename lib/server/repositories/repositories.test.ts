import test from "node:test";
import assert from "node:assert/strict";

import { createPairingRepository } from "./pairing-repository.ts";

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