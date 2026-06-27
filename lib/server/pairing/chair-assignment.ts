import type { ChairAllocationContext, ChairAllocationResult, ChairAssignmentInput, SessionAdjudicator } from "./types.ts";
import { MAX_ADJUDICATORS_PER_ROOM } from "./types.ts";

export function computeChairAssignmentScore(input: ChairAssignmentInput): number {
  return 0.6 * input.chairScore + 0.25 * input.adjudicatorAverageScore + 0.15 * input.chairConfidenceScore;
}

function getAdjudicatorScore(adjudicator: SessionAdjudicator & { metrics: { chairScore: number; adjudicatorAverageScore: number; confidence: number } | null }) {
  return computeChairAssignmentScore({
    chairScore: adjudicator.metrics?.chairScore ?? 0,
    adjudicatorAverageScore: adjudicator.metrics?.adjudicatorAverageScore ?? 0,
    chairConfidenceScore: adjudicator.metrics?.confidence ?? 0,
  });
}

export function assignChairsToRooms(input: ChairAllocationContext): ChairAllocationResult {
  const sortedRooms = input.rooms
    .slice()
    .sort((left, right) => (right.roomDifficultyScore ?? 0) - (left.roomDifficultyScore ?? 0));
  const sortedAdjudicators = input.adjudicators
    .slice()
    .sort((left, right) => getAdjudicatorScore(right) - getAdjudicatorScore(left));

  const roomChairs = sortedRooms.map((room, index) => {
    const adjudicator = sortedAdjudicators[index];
    return {
      roomIndex: room.roomIndex,
      participantId: adjudicator.participantId,
      chairAssignmentScore: getAdjudicatorScore(adjudicator),
    };
  });

  const surplusAdjudicators = sortedAdjudicators.slice(sortedRooms.length);
  const panelAssignments: Array<{ roomIndex: number; participantId: string }> = [];
  const panelCounts = new Map(sortedRooms.map((room) => [room.roomIndex, 1]));
  let roomCursor = 0;

  for (const adjudicator of surplusAdjudicators) {
    let assigned = false;
    for (let attempts = 0; attempts < sortedRooms.length; attempts++) {
      const room = sortedRooms[(roomCursor + attempts) % sortedRooms.length];
      const currentCount = panelCounts.get(room.roomIndex) ?? 1;
      if (currentCount < MAX_ADJUDICATORS_PER_ROOM) {
        panelAssignments.push({ roomIndex: room.roomIndex, participantId: adjudicator.participantId });
        panelCounts.set(room.roomIndex, currentCount + 1);
        roomCursor = (roomCursor + attempts + 1) % Math.max(sortedRooms.length, 1);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      break;
    }
  }

  const assignedPanelIds = new Set(panelAssignments.map((assignment) => assignment.participantId));
  const reserveAdjudicatorIds = surplusAdjudicators
    .filter((adjudicator) => !assignedPanelIds.has(adjudicator.participantId))
    .map((adjudicator) => adjudicator.participantId);

  return {
    roomChairs,
    panelAssignments,
    reserveAdjudicatorIds,
  };
}