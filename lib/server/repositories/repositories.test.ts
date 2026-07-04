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
  let published = false;

  const tx = {
    debateSession: {
      findUnique: async (args: Record<string, unknown>) => {
        const select = args.select as Record<string, unknown>;
        if (select.publishedProposalId && !select.id) {
          return {
            publishedProposalId: published ? "proposal-1" : null,
            publishedAt: published ? new Date("2026-01-01T00:02:00.000Z") : null,
            acceptedProposalId: published ? "proposal-1" : null,
          };
        }

        return {
          id: "session-1",
          motionType: "BP",
          motiontype: "BP",
          motionText: "This house would...",
          publishedAt: published ? new Date("2026-01-01T00:02:00.000Z") : null,
          publishedProposalId: published ? "proposal-1" : null,
        };
      },
      update: async () => {
        published = true;
        calls.push("debateSession.update");
        return { id: "session-1" };
      },
    },
    pairingProposal: {
      findFirst: async () => ({ id: "proposal-1", roomAssignments: [] }),
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
    attendance: {
      updateMany: async () => {
        calls.push("attendance.updateMany");
        return { count: 1 };
      },
    },
    sessionRoleAssignment: {
      deleteMany: async () => {
        calls.push("sessionRoleAssignment.deleteMany");
        return { count: 0 };
      },
      createMany: async () => {
        calls.push("sessionRoleAssignment.createMany");
        return { count: 0 };
      },
    },
  };

  const mockClient = {
    debateSession: tx.debateSession,
    pairingProposal: tx.pairingProposal,
    $transaction: async (callback: (transactionClient: typeof tx) => Promise<unknown>) => {
      calls.push("$transaction");
      return callback(tx);
    },
  };

  const repository = createPairingRepository(mockClient as never);
  const publishedResult = await repository.publishProposalTransaction({ sessionId: "session-1" });

  assert.deepEqual(calls, [
    "$transaction",
    "pairingProposal.update",
    "sessionRoleAssignment.deleteMany",
    "debateSession.update",
    "attendance.updateMany",
  ]);
  assert.equal(publishedResult.sessionId, "session-1");
  assert.equal(publishedResult.proposalId, "proposal-1");
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
    pairingProposal: tx.pairingProposal,
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

test("overrideProposalReviewAction preserves score breakdown and stores override audit", async () => {
  let updatedData: Record<string, unknown> | null = null;
  let reviewLogData: Record<string, unknown> | null = null;
  const overrideParticipants = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "chair-1"];
  const overrideSessionRoleAssignments = overrideParticipants.map((participantId) => ({
    memberId: participantId,
    cabinetId: null,
    presidentId: null,
    role: participantId === "chair-1" ? "adjudicator" : "speaker",
    isChair: participantId === "chair-1",
  }));
  const overrideRooms = [
    {
      roomIndex: 1,
      teams: [
        { bpPosition: "OG", speakers: [{ participantId: "s1", speakingRole: "PM" }, { participantId: "s2", speakingRole: "DPM" }] },
        { bpPosition: "OO", speakers: [{ participantId: "s3", speakingRole: "LO" }, { participantId: "s4", speakingRole: "DLO" }] },
        { bpPosition: "CG", speakers: [{ participantId: "s5", speakingRole: "MG" }, { participantId: "s6", speakingRole: "GW" }] },
        { bpPosition: "CO", speakers: [{ participantId: "s7", speakingRole: "MO" }, { participantId: "s8", speakingRole: "OW" }] },
      ],
      adjudicators: [{ participantId: "chair-1", isChair: true }],
    },
  ];

  const tx = {
    pairingProposal: {
      findUnique: async (args?: Record<string, unknown>) => {
        const select = (args?.select ?? {}) as Record<string, unknown>;
        if (select.roomAssignments) {
          return {
            id: "proposal-1",
            sessionId: "session-1",
            proposalVersion: 1,
            status: "APPROVED",
            engineVersion: "pairing-engine-v1",
            ruleVersion: "pairing-rules-v1",
            topBandRank: 1,
            proposalScore: 0.85,
            scoreBreakdownJson: updatedData?.["scoreBreakdownJson"] ?? {},
            generatedAt: new Date("2026-01-01T00:00:00.000Z"),
            generatedBy: "cabinet-1",
            approvedAt: new Date("2026-01-01T00:01:00.000Z"),
            publishedAt: null,
            isPublishedOfficially: false,
            roomAssignments: [],
            unassignedParticipants: [],
            reviewLogs: [{ action: "OVERRIDE", createdAt: new Date("2026-01-01T00:01:00.000Z") }],
            session: {
              publishedProposalId: null,
              sessionRoleAssignments: overrideSessionRoleAssignments,
            },
          };
        }

        return {
          id: "proposal-1",
          sessionId: "session-1",
          status: "GENERATED",
          isPublishedOfficially: false,
          scoreBreakdownJson: {
            roomBalanceScore: 0.9,
            adjudicatorAverageScore: 0.8,
            chairScore: 0.7,
            teamQualityAggregate: 0.6,
            experienceDistributionAggregate: 0.5,
            totalProposalScore: 0.85,
          },
          session: {
            publishedProposalId: null,
            sessionRoleAssignments: overrideSessionRoleAssignments,
          },
        };
      },
      update: async (args: Record<string, unknown>) => {
        updatedData = args.data as Record<string, unknown>;
        return { id: "proposal-1" };
      },
    },
    teamSpeakerAssignment: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }) },
    roomAdjudicatorAssignment: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }) },
    debateTeamAssignment: { deleteMany: async () => ({ count: 0 }), create: async () => ({ id: "team-1" }) },
    debateRoomAssignment: { deleteMany: async () => ({ count: 0 }), create: async () => ({ id: "room-1" }) },
    unassignedParticipant: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }) },
    sessionRoleAssignment: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }) },
    proposalReviewLog: {
      create: async (args: Record<string, unknown>) => {
        reviewLogData = args.data as Record<string, unknown>;
        return { id: "log-1" };
      },
    },
    debateSession: {
      update: async () => ({ id: "session-1" }),
    },
  };

  const mockClient = {
    pairingProposal: tx.pairingProposal,
    $transaction: async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx),
  };

  const repository = createPairingRepository(mockClient as never);
  const proposal = await repository.overrideProposalReviewAction({
    proposalId: "proposal-1",
    reviewerId: "cabinet-1",
    overrideType: "manual_assignment",
    payload: { rooms: overrideRooms },
    notes: "Keep original payload.",
  });

  const scoreBreakdownJson = (updatedData?.["scoreBreakdownJson"] ?? {}) as { manualOverride?: Record<string, unknown> };
  assert.equal(scoreBreakdownJson.manualOverride?.overrideType, "manual_assignment");
  assert.equal(scoreBreakdownJson.manualOverride?.reviewerId, "cabinet-1");
  assert.ok(typeof scoreBreakdownJson.manualOverride?.overriddenAt === "string");
  assert.equal(typeof reviewLogData?.["notes"], "string");
  assert.equal(proposal.reviewState.lastAction, "OVERRIDE");
});

test("publishProposalTransaction returns the existing official result on double publish", async () => {
  const tx = {
    debateSession: {
      findUnique: async (args: Record<string, unknown>) => {
        const select = args.select as Record<string, unknown>;
        if (select.publishedProposalId && !select.id) {
          return {
            publishedProposalId: "proposal-1",
            publishedAt: new Date("2026-01-01T00:02:00.000Z"),
            acceptedProposalId: "proposal-1",
          };
        }

        return {
          id: "session-1",
          motionType: "IR",
          motiontype: "IR",
          motionText: "Published motion",
          publishedAt: new Date("2026-01-01T00:02:00.000Z"),
          publishedProposalId: "proposal-1",
        };
      },
      update: async () => ({ id: "session-1" }),
    },
    pairingProposal: {
      findFirst: async () => {
        throw new Error("should not search for another approved proposal once already published");
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
    attendance: {
      updateMany: async () => ({ count: 0 }),
    },
    sessionRoleAssignment: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async () => ({ count: 0 }),
    },
  };

  const mockClient = {
    debateSession: tx.debateSession,
    pairingProposal: tx.pairingProposal,
    $transaction: async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx),
  };

  const repository = createPairingRepository(mockClient as never);
  const published = await repository.publishProposalTransaction({ sessionId: "session-1" });

  assert.equal(published.proposalId, "proposal-1");
  assert.equal(published.sessionId, "session-1");
});
