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
import { isCandidateValid } from "./hard-rules.ts";
import { buildUnassignedParticipants, computeRoomPlan } from "./leftovers.ts";

const benchPositions = ["OG", "OO", "CG", "CO"] as const;
const speakingRoles: ReadonlyArray<readonly [SpeakingRole, SpeakingRole]> = [
  ["PM", "DPM"],
  ["LO", "DLO"],
  ["MG", "GW"],
  ["MO", "OW"],
] as const;
const earlyTeamIndexes = new Set([0, 1]);

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

function buildEarlySpeakingSlotIndexes(roomCount: number): number[] {
  const indexes: number[] = [];

  for (let roomIndex = 0; roomIndex < roomCount; roomIndex++) {
    const roomStartIndex = roomIndex * SPEAKERS_PER_ROOM;
    for (let teamIndex = 0; teamIndex < TEAMS_PER_ROOM; teamIndex++) {
      if (!earlyTeamIndexes.has(teamIndex)) {
        continue;
      }
      const teamStartIndex = roomStartIndex + teamIndex * SPEAKERS_PER_TEAM;
      indexes.push(teamStartIndex, teamStartIndex + 1);
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
      anchoredSpeakers.concat(rotateArray(rotatableSpeakers, candidateIndex)),
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

    const candidate: PairingCandidate = {
      rooms,
      unassignedParticipants: buildUnassignedParticipants(leftoverSpeakers),
    };

    if (isCandidateValid(candidate, context)) {
      generatedCandidates.push(candidate);
    }
  }

  return generatedCandidates;
}
