import type { PairingGenerationContext, SpeakingRole } from "../../../types/pairing.ts";
import type { PairingCandidate, PairingRoomSpeakerCandidate, RoomCandidate, SessionAdjudicator, SessionSpeaker } from "./types.ts";
import {
  MAX_CANDIDATE_COUNT,
  MAX_GENERATION_TIME_BUDGET_MS,
  SPEAKERS_PER_ROOM,
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

function rotateArray<T>(items: T[], offset: number): T[] {
  if (items.length === 0) {
    return [];
  }

  const normalizedOffset = ((offset % items.length) + items.length) % items.length;
  return items.slice(normalizedOffset).concat(items.slice(0, normalizedOffset));
}

function toSpeakerAssignments(participants: SessionSpeaker[]): PairingRoomSpeakerCandidate[] {
  return participants.map((participant, index) => ({
    participantId: participant.participantId,
    speakingRole: speakingRoles[Math.floor(index / 2)][index % 2],
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

  const assignableSpeakers = speakers.slice(0, speakers.length - leftoverSpeakerCount);
  const leftoverSpeakers = speakers.slice(assignableSpeakers.length);
  const generatedCandidates: PairingCandidate[] = [];

  for (let candidateIndex = 0; candidateIndex < MAX_CANDIDATE_COUNT; candidateIndex++) {
    if (Date.now() - startTime > MAX_GENERATION_TIME_BUDGET_MS) {
      break;
    }

    const rotatedSpeakers = rotateArray(assignableSpeakers, candidateIndex);
    const rooms: RoomCandidate[] = [];

    for (let roomIndex = 0; roomIndex < roomCount; roomIndex++) {
      const roomSpeakers = rotatedSpeakers.slice(
        roomIndex * SPEAKERS_PER_ROOM,
        roomIndex * SPEAKERS_PER_ROOM + SPEAKERS_PER_ROOM,
      );

      const teams = benchPositions.map((bpPosition, teamIndex) => {
        const teamParticipants = roomSpeakers.slice(teamIndex * 2, teamIndex * 2 + 2);
        return {
          bpPosition,
          teamScore: null,
          speakers: toSpeakerAssignments(teamParticipants),
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