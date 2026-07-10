import assert from "node:assert/strict";
import test from "node:test";

import { createPairingPublishService } from "../pairing/publish.ts";
import { createPairingReviewService } from "../pairing/review.ts";
import { parseRealtimeSubscriptions } from "./connection-service.ts";
import { publishRealtimeEvent } from "./event-publisher.ts";
import { acceptRealtimeConnection, RealtimeConnectionError } from "./websocket-hub.ts";

const adminUser = {
  id: "cabinet-1",
  name: "Cabinet Admin",
  email: "cabinet@example.com",
  role: "cabinet" as const,
  isVerified: true,
};

const memberUser = {
  id: "member-1",
  name: "Member One",
  email: "member@example.com",
  role: "Member" as const,
  isVerified: true,
};

test("allowed roles can connect", () => {
  const memberConnection = acceptRealtimeConnection({ user: memberUser });
  const adminConnection = acceptRealtimeConnection({ user: adminUser });

  assert.equal(memberConnection.transport, "WEBSOCKET_SUPPLEMENTAL");
  assert.equal(adminConnection.reconnectStrategy, "AUTHENTICATED_RESUBSCRIBE_THEN_HTTP_REFETCH");

  memberConnection.close();
  adminConnection.close();
});

test("unauthorized connection or subscription is rejected", () => {
  assert.throws(
    () => acceptRealtimeConnection({
      user: {
        id: "guest-1",
        name: "Guest",
        email: "guest@example.com",
        role: "Guest" as never,
        isVerified: false,
      },
    }),
    (error: unknown) => error instanceof RealtimeConnectionError && error.code === "CONNECTION_FORBIDDEN",
  );

  const memberConnection = acceptRealtimeConnection({ user: memberUser });
  assert.throws(
    () => memberConnection.subscribe({ scope: "SESSION_ADMIN", sessionId: "session-1" }),
    (error: unknown) => error instanceof RealtimeConnectionError && error.code === "SUBSCRIPTION_FORBIDDEN",
  );
  memberConnection.close();
});

test("global dashboard and leaderboard subscriptions parse from client query params", () => {
  const subscriptions = parseRealtimeSubscriptions(
    new URLSearchParams([
      ["subscription", "DASHBOARD"],
      ["subscription", "LEADERBOARD"],
      ["subscription", "SESSION_PUBLISHED:session-1"],
    ]),
  );

  assert.deepEqual(subscriptions, [
    { scope: "DASHBOARD" },
    { scope: "LEADERBOARD" },
    { scope: "SESSION_PUBLISHED", sessionId: "session-1" },
  ]);
});

test("admin subscribers receive post-commit proposal lifecycle events", async () => {
  const adminConnection = acceptRealtimeConnection({
    user: adminUser,
    subscriptions: [{ scope: "SESSION_ADMIN", sessionId: "session-1" }],
  });

  const service = createPairingReviewService(
    {
      approveProposalReviewAction: async () => ({
        proposalId: "proposal-1",
        sessionId: "session-1",
        version: 1,
        status: "APPROVED",
        engineVersion: "pairing-engine-v1",
        ruleVersion: "pairing-rules-v1",
        topBandRank: 1,
        proposalScore: 0.8,
        scoreBreakdown: {
          roomBalanceScore: 0.8,
          adjudicatorAverageScore: 0.8,
          chairScore: 0.8,
          teamQualityAggregate: 0.8,
          experienceDistributionAggregate: 0.8,
          totalProposalScore: 0.8,
        },
        generatedAt: "2026-06-28T00:00:00.000Z",
        generatedBy: "cabinet-1",
        approvedAt: "2026-06-28T00:01:00.000Z",
        publishedAt: null,
        isPublishedOfficially: false,
      }),
      overrideProposalReviewAction: async () => {
        throw new Error("not used");
      },
      recordRegenerateReviewAction: async () => ({ sessionId: "session-1" }),
      upsertProposalRating: async () => ({
        proposalId: "proposal-1",
        reviewerId: "cabinet-1",
        rating: 4,
        issueTags: [],
        notes: null,
      }),
    },
    async () => ({ ok: false, reason: "SESSION_NOT_FOUND", detail: "unused", violations: [] }),
    async (_sessionId, event) => publishRealtimeEvent(event),
  );

  await service.approveProposal("proposal-1", "cabinet-1");

  const [event] = adminConnection.takeEvents();
  assert.equal(event.eventType, "pairing.proposal.approved");
  assert.equal(event.sessionId, "session-1");
  adminConnection.close();
});

test("members do not receive unpublished proposal events", async () => {
  const memberConnection = acceptRealtimeConnection({
    user: memberUser,
    subscriptions: [{ scope: "SESSION_PUBLISHED", sessionId: "session-1" }],
  });

  const service = createPairingReviewService(
    {
      approveProposalReviewAction: async () => ({
        proposalId: "proposal-1",
        sessionId: "session-1",
        version: 1,
        status: "APPROVED",
        engineVersion: "pairing-engine-v1",
        ruleVersion: "pairing-rules-v1",
        topBandRank: 1,
        proposalScore: 0.8,
        scoreBreakdown: {
          roomBalanceScore: 0.8,
          adjudicatorAverageScore: 0.8,
          chairScore: 0.8,
          teamQualityAggregate: 0.8,
          experienceDistributionAggregate: 0.8,
          totalProposalScore: 0.8,
        },
        generatedAt: "2026-06-28T00:00:00.000Z",
        generatedBy: "cabinet-1",
        approvedAt: "2026-06-28T00:01:00.000Z",
        publishedAt: null,
        isPublishedOfficially: false,
      }),
      overrideProposalReviewAction: async () => {
        throw new Error("not used");
      },
      recordRegenerateReviewAction: async () => ({ sessionId: "session-1" }),
      upsertProposalRating: async () => ({
        proposalId: "proposal-1",
        reviewerId: "cabinet-1",
        rating: 4,
        issueTags: [],
        notes: null,
      }),
    },
    async () => ({ ok: false, reason: "SESSION_NOT_FOUND", detail: "unused", violations: [] }),
    async (_sessionId, event) => publishRealtimeEvent(event),
  );

  await service.approveProposal("proposal-1", "cabinet-1");
  assert.equal(memberConnection.takeEvents().length, 0);
  memberConnection.close();
});

test("websocket fan-out failure does not corrupt committed state", async () => {
  const service = createPairingPublishService(
    {
      publishProposalTransaction: async () => ({
        sessionId: "session-1",
        proposalId: "proposal-1",
        publishedAt: "2026-06-28T00:02:00.000Z",
        motionType: "OPEN",
        motionText: "Test motion",
        rooms: [],
        unassignedParticipants: [],
      }),
      getPublishedPairing: async () => null,
    },
    async () => {
      throw new Error("fan-out failed");
    },
  );

  const result = await service.publishApprovedProposal("session-1");
  assert.equal(result.publishedPairing.proposalId, "proposal-1");
});
