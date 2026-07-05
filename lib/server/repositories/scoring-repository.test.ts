import assert from "node:assert/strict";
import test from "node:test";

import { createScoringRepository } from "./scoring-repository.ts";

test("adjudicator leaderboard dedupes chair rounds by session and resolves chair-only names", async () => {
  const repository = createScoringRepository({
    adjudicatorScoreRecord: {
      findMany: async () => [],
    },
    chairFeedbackRecord: {
      findMany: async () => [
        {
          sessionId: "session-1",
          chairMemberId: "chair-1",
          chairCabinetId: null,
          chairPresidentId: null,
          chairMember: { name: "Mobasshir Khan" },
          chairCabinet: null,
          chairPresident: null,
        },
        {
          sessionId: "session-1",
          chairMemberId: "chair-1",
          chairCabinetId: null,
          chairPresidentId: null,
          chairMember: { name: "Mobasshir Khan" },
          chairCabinet: null,
          chairPresident: null,
        },
        {
          sessionId: "session-2",
          chairMemberId: "chair-1",
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
  assert.equal(leaderboard[0]?.adjudicatedCount, 0);
  assert.equal(leaderboard[0]?.score, 0);
});
