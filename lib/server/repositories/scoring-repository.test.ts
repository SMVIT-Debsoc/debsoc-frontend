import assert from "node:assert/strict";
import test from "node:test";

import { createScoringRepository } from "./scoring-repository.ts";

test("adjudicator leaderboard uses combined average across chair sessions and panel sessions", async () => {
  const repository = createScoringRepository({
    adjudicatorScoreRecord: {
      findMany: async () => [
        {
          adjudicatorMemberId: "adj-1",
          adjudicatorCabinetId: null,
          adjudicatorPresidentId: null,
          rating: 5,
          adjudicatorMember: { name: "Mobasshir Khan" },
          adjudicatorCabinet: null,
          adjudicatorPresident: null,
        },
      ],
    },
    chairFeedbackRecord: {
      findMany: async () => [
        {
          sessionId: "session-1",
          rating: 8,
          chairMemberId: "adj-1",
          chairCabinetId: null,
          chairPresidentId: null,
          chairMember: { name: "Mobasshir Khan" },
          chairCabinet: null,
          chairPresident: null,
        },
        {
          sessionId: "session-1",
          rating: 6,
          chairMemberId: "adj-1",
          chairCabinetId: null,
          chairPresidentId: null,
          chairMember: { name: "Mobasshir Khan" },
          chairCabinet: null,
          chairPresident: null,
        },
        {
          sessionId: "session-2",
          rating: 9,
          chairMemberId: "adj-1",
          chairCabinetId: null,
          chairPresidentId: null,
          chairMember: { name: "Mobasshir Khan" },
          chairCabinet: null,
          chairPresident: null,
        },
      ],
    },
  } as never);

  const leaderboard = await repository.getAdjudicatorLeaderboardRawData();

  assert.equal(leaderboard.length, 1);
  assert.equal(leaderboard[0]?.name, "Mobasshir Khan");
  assert.equal(leaderboard[0]?.chairedCount, 2);
  assert.equal(leaderboard[0]?.adjudicatedCount, 1);
  assert.equal(leaderboard[0]?.sessionsCount, 3);
  assert.equal(leaderboard[0]?.score, 7);
});
