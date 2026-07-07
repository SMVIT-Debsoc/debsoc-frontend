import type { PairingGenerationContext, SpeakingRole } from "../../../types/pairing.ts";
import type { PairingCandidate, PairingRoomSpeakerCandidate, RoomCandidate, SessionAdjudicator, SessionSpeaker } from "./types.ts";
import {
  MAX_CANDIDATE_COUNT,
  MAX_GENERATION_TIME_BUDGET_MS,
  SPEAKERS_PER_ROOM,
  SPEAKERS_PER_TEAM,
  TEAMS_PER_ROOM,
} from "./types.ts";
import { assignChairsToRooms } from "./chair-assignment.ts";
import { buildUnassignedParticipants, computeRoomPlan } from "./leftovers.ts";

const benchPositions = ["OG", "OO", "CG", "CO"] as const;
const speakingRoles: ReadonlyArray<readonly [SpeakingRole, SpeakingRole]> = [
  ["PM", "DPM"],
  ["LO", "DLO"],
  ["MG", "GW"],
  ["MO", "OW"],
] as const;
// Within a room the flat speaker slots are [PM, DPM, LO, DLO, MG, GW, MO, OW].
// Per docs/05 time_constraint the genuinely-early roles are PM (1st speaker,
// offset 0) and LO (2nd speaker, offset 2). DPM/DLO speak 3rd/4th, not early.
const earlySpeakingSlotOffsets = [0, 2] as const;

function rotateArray<T>(items: T[], offset: number): T[] {
  if (items.length === 0) {
    return [];
  }

  const normalizedOffset = ((offset % items.length) + items.length) % items.length;
  return items.slice(normalizedOffset).concat(items.slice(0, normalizedOffset));
}

function buildPrioritizedSpeakerOrder(
  speakers: SessionSpeaker[],
  context: PairingGenerationContext,
): { orderedSpeakers: SessionSpeaker[]; anchoredCount: number } {
  const byId = new Map(speakers.map((speaker) => [speaker.participantId, speaker]));
  const seen = new Set<string>();
  const prioritized: SessionSpeaker[] = [];

  const orderedTimeConstraints = [
    ...context.rules.timeConstraints.filter((rule) => rule.isStrict),
    ...context.rules.timeConstraints.filter((rule) => !rule.isStrict),
  ];

  for (const rule of orderedTimeConstraints) {
    const speaker = byId.get(rule.participantId);
    if (speaker && !seen.has(speaker.participantId)) {
      prioritized.push(speaker);
      seen.add(speaker.participantId);
    }
  }

  for (const rule of context.rules.forcedTeamUps) {
    for (const participantId of [rule.firstParticipantId, rule.secondParticipantId]) {
      const speaker = byId.get(participantId);
      if (speaker && !seen.has(speaker.participantId)) {
        prioritized.push(speaker);
        seen.add(speaker.participantId);
      }
    }
  }

  const orderedSpeakers = prioritized.concat(
    speakers.filter((speaker) => !seen.has(speaker.participantId)),
  );

  return {
    orderedSpeakers,
    anchoredCount: prioritized.length,
  };
}

function buildTimeConstrainedSpeakerOrder(
  speakers: SessionSpeaker[],
  context: PairingGenerationContext,
): SessionSpeaker[] {
  const byId = new Map(speakers.map((speaker) => [speaker.participantId, speaker]));
  const seen = new Set<string>();
  const constrainedSpeakers: SessionSpeaker[] = [];
  const orderedTimeConstraints = [
    ...context.rules.timeConstraints.filter((rule) => rule.isStrict),
    ...context.rules.timeConstraints.filter((rule) => !rule.isStrict),
  ];

  for (const rule of orderedTimeConstraints) {
    const speaker = byId.get(rule.participantId);
    if (speaker && !seen.has(speaker.participantId)) {
      constrainedSpeakers.push(speaker);
      seen.add(speaker.participantId);
    }
  }

  return constrainedSpeakers;
}

// Forced team-up speakers ("anchored") must stay on the same team, but they
// should still move around the grid across candidates so regeneration reshuffles
// their room/bench/position instead of pinning them to the front every time.
// We keep the anchored block contiguous and insert it at a team-aligned offset
// that cycles with candidateIndex: because the block length is even and the
// offset is a multiple of SPEAKERS_PER_TEAM, each anchored pair stays aligned to
// a team boundary (same team preserved; candidates that still violate a rule are
// dropped by the hard-rule filter). candidateIndex 0 reproduces the original
// front-anchored arrangement so a feasible candidate always exists.
function assembleAnchoredAndRotatable(
  anchoredSpeakers: SessionSpeaker[],
  rotatableSpeakers: SessionSpeaker[],
  candidateIndex: number,
): SessionSpeaker[] {
  const rotatedRotatable = rotateArray(rotatableSpeakers, candidateIndex);
  if (anchoredSpeakers.length === 0) {
    return rotatedRotatable;
  }

  const teamSlotCount = Math.floor(
    (anchoredSpeakers.length + rotatableSpeakers.length) / SPEAKERS_PER_TEAM,
  );
  if (teamSlotCount === 0) {
    return anchoredSpeakers.concat(rotatedRotatable);
  }

  const insertIndex = (candidateIndex % teamSlotCount) * SPEAKERS_PER_TEAM;
  return [
    ...rotatedRotatable.slice(0, insertIndex),
    ...anchoredSpeakers,
    ...rotatedRotatable.slice(insertIndex),
  ];
}

function buildEarlySpeakingSlotIndexes(roomCount: number): number[] {
  const indexes: number[] = [];

  // Iterate offsets in the outer loop so every room's PM slot is filled before
  // any LO slot. With N constrained speakers this spreads them across rooms
  // (room0 PM, room1 PM, room0 LO, ...) instead of packing one room full.
  for (const slotOffset of earlySpeakingSlotOffsets) {
    for (let roomIndex = 0; roomIndex < roomCount; roomIndex++) {
      indexes.push(roomIndex * SPEAKERS_PER_ROOM + slotOffset);
    }
  }

  return indexes;
}

function arrangeSpeakersForTimeConstraints(
  constrainedSpeakers: SessionSpeaker[],
  otherSpeakers: SessionSpeaker[],
  roomCount: number,
): SessionSpeaker[] {
  const arrangedSpeakers: Array<SessionSpeaker | null> = Array.from(
    { length: constrainedSpeakers.length + otherSpeakers.length },
    () => null,
  );
  const earlySlotIndexes = buildEarlySpeakingSlotIndexes(roomCount);
  let overflowIndex = 0;

  for (const speaker of constrainedSpeakers) {
    const earlySlotIndex = earlySlotIndexes.shift();
    if (earlySlotIndex !== undefined && earlySlotIndex < arrangedSpeakers.length) {
      arrangedSpeakers[earlySlotIndex] = speaker;
      continue;
    }

    while (arrangedSpeakers[overflowIndex]) {
      overflowIndex += 1;
    }
    arrangedSpeakers[overflowIndex] = speaker;
  }

  const remainingSpeakers = otherSpeakers[Symbol.iterator]();
  return arrangedSpeakers.map((speaker) => {
    if (speaker) {
      return speaker;
    }

    const nextSpeaker = remainingSpeakers.next();
    if (nextSpeaker.done) {
      throw new Error("Speaker arrangement failed because the candidate speaker pool was exhausted.");
    }
    return nextSpeaker.value;
  });
}

function orderTeamParticipants(
  participants: SessionSpeaker[],
  context: PairingGenerationContext,
): SessionSpeaker[] {
  const strictConstrainedIds = new Set(
    context.rules.timeConstraints.filter((rule) => rule.isStrict).map((rule) => rule.participantId),
  );
  const constrainedIds = new Set(context.rules.timeConstraints.map((rule) => rule.participantId));

  return participants.slice().sort((left, right) => {
    const leftStrictPriority = strictConstrainedIds.has(left.participantId) ? 0 : 1;
    const rightStrictPriority = strictConstrainedIds.has(right.participantId) ? 0 : 1;
    if (leftStrictPriority !== rightStrictPriority) {
      return leftStrictPriority - rightStrictPriority;
    }

    const leftPriority = constrainedIds.has(left.participantId) ? 0 : 1;
    const rightPriority = constrainedIds.has(right.participantId) ? 0 : 1;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.participantId.localeCompare(right.participantId);
  });
}

function toSpeakerAssignments(
  participants: SessionSpeaker[],
  benchIndex: number,
): PairingRoomSpeakerCandidate[] {
  const rolePair = speakingRoles[benchIndex];

  return participants.map((participant, index) => ({
    participantId: participant.participantId,
    speakingRole: rolePair[index] ?? rolePair[rolePair.length - 1],
  }));
}

export function generateCandidateProposals(context: PairingGenerationContext): PairingCandidate[] {
  const startTime = Date.now();
  const speakers = context.participants.filter(
    (participant): participant is SessionSpeaker => participant.sessionRole === "speaker",
  );
  const adjudicators = context.participants.filter(
    (participant): participant is SessionAdjudicator => participant.sessionRole === "adjudicator",
  );

  const { roomCount, leftoverSpeakerCount } = computeRoomPlan(speakers.length);
  if (roomCount === 0) {
    return [];
  }
  const { orderedSpeakers, anchoredCount } = buildPrioritizedSpeakerOrder(speakers, context);
  const assignableSpeakers = orderedSpeakers.slice(0, orderedSpeakers.length - leftoverSpeakerCount);
  const leftoverSpeakers = orderedSpeakers.slice(assignableSpeakers.length);
  const timeConstrainedSpeakers = buildTimeConstrainedSpeakerOrder(assignableSpeakers, context);
  const timeConstrainedIds = new Set(timeConstrainedSpeakers.map((speaker) => speaker.participantId));
  const anchoredSpeakers = assignableSpeakers
    .slice(0, anchoredCount)
    .filter((speaker) => !timeConstrainedIds.has(speaker.participantId));
  const rotatableSpeakers = assignableSpeakers
    .slice(anchoredCount)
    .filter((speaker) => !timeConstrainedIds.has(speaker.participantId));
  const generatedCandidates: PairingCandidate[] = [];

  for (let candidateIndex = 0; candidateIndex < MAX_CANDIDATE_COUNT; candidateIndex++) {
    if (Date.now() - startTime > MAX_GENERATION_TIME_BUDGET_MS) {
      break;
    }

    const rotatedSpeakers = arrangeSpeakersForTimeConstraints(
      timeConstrainedSpeakers,
      assembleAnchoredAndRotatable(anchoredSpeakers, rotatableSpeakers, candidateIndex),
      roomCount,
    );
    const rooms: RoomCandidate[] = [];

    for (let roomIndex = 0; roomIndex < roomCount; roomIndex++) {
      const roomSpeakers = rotatedSpeakers.slice(
        roomIndex * SPEAKERS_PER_ROOM,
        roomIndex * SPEAKERS_PER_ROOM + SPEAKERS_PER_ROOM,
      );

      const teams = benchPositions.map((bpPosition, teamIndex) => {
        const teamParticipants = orderTeamParticipants(
          roomSpeakers.slice(teamIndex * TEAMS_PER_ROOM / 2, teamIndex * TEAMS_PER_ROOM / 2 + 2),
          context,
        );
        return {
          bpPosition,
          teamScore: null,
          speakers: toSpeakerAssignments(teamParticipants, teamIndex),
        };
      });

      rooms.push({
        roomIndex: roomIndex + 1,
        roomScore: null,
        roomBalanceScore: null,
        roomDifficultyScore: roomCount - roomIndex,
        teams,
        adjudicators: [],
      });
    }

    const chairAllocation = assignChairsToRooms({
      rooms: rooms.map((room) => ({ roomIndex: room.roomIndex, roomDifficultyScore: room.roomDifficultyScore })),
      adjudicators: adjudicators.map((adjudicator) => ({
        ...adjudicator,
        metrics: context.adjudicatorMetricsById.get(adjudicator.participantId) ?? null,
      })),
    });

    for (const room of rooms) {
      const chair = chairAllocation.roomChairs.find((assignment) => assignment.roomIndex === room.roomIndex);
      const panel = chairAllocation.panelAssignments.filter((assignment) => assignment.roomIndex === room.roomIndex);
      room.adjudicators = [
        ...(chair
          ? [{ participantId: chair.participantId, isChair: true, chairAssignmentScore: chair.chairAssignmentScore }]
          : []),
        ...panel.map((assignment) => ({ participantId: assignment.participantId, isChair: false, chairAssignmentScore: null })),
      ];
    }

    // Do NOT pre-filter with the hard rules here: the engine re-validates every
    // candidate and, when all of them violate a rule, reports the concrete
    // violations (NO_VALID_PROPOSAL). Filtering here collapsed that into an
    // uninformative NO_CANDIDATES_GENERATED and made the engine's diagnostic
    // branch unreachable.
    generatedCandidates.push({
      rooms,
      unassignedParticipants: buildUnassignedParticipants(leftoverSpeakers),
    });
  }

  return generatedCandidates;
}
