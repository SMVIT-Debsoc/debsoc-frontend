import type { ParticipantContext, UnassignedParticipantView } from "../../../types/pairing.ts";
import type { RoomPlan } from "./types.ts";
import { SPEAKERS_PER_ROOM } from "./types.ts";

export function computeRoomPlan(speakerCount: number): RoomPlan {
  if (speakerCount <= 0) {
    return { roomCount: 0, leftoverSpeakerCount: 0 };
  }

  return {
    roomCount: Math.floor(speakerCount / SPEAKERS_PER_ROOM),
    leftoverSpeakerCount: speakerCount % SPEAKERS_PER_ROOM,
  };
}

export function buildUnassignedParticipants(
  participants: ParticipantContext[],
): UnassignedParticipantView[] {
  return participants.map((participant) => ({
    participantId: participant.participantId,
    reason: "INSUFFICIENT_SPEAKERS_FOR_FULL_ROOM",
  }));
}