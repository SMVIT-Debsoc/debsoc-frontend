import type { PairingGenerationContext } from "../../../types/pairing.ts";
import type { HardRuleValidationResult, PairingCandidate } from "./types.ts";
import { SPEAKERS_PER_ROOM, SPEAKERS_PER_TEAM, TEAMS_PER_ROOM } from "./types.ts";

type SpeakerAssignmentLocation = {
  roomIndex: number;
  teamKey: string;
  speakingRole: string;
};

const EARLY_SPEAKING_ROLES = new Set(["PM", "LO"]);

export function validateHardRules(
  candidate: PairingCandidate,
  context: PairingGenerationContext,
): HardRuleValidationResult {
  const violations: HardRuleValidationResult["violations"] = [];
  const participantIds = new Set(context.participants.map((participant) => participant.participantId));
  const assignedParticipants = new Set<string>();
  const speakerAssignments = new Map<string, SpeakerAssignmentLocation>();

  for (const room of candidate.rooms) {
    if (room.teams.length !== TEAMS_PER_ROOM) {
      violations.push({ code: "INVALID_TEAM_COUNT", message: `Room ${room.roomIndex} must contain four teams.` });
    }

    const roomSpeakerCount = room.teams.reduce((total, team) => total + team.speakers.length, 0);
    if (roomSpeakerCount !== SPEAKERS_PER_ROOM) {
      violations.push({ code: "INVALID_ROOM_SIZE", message: `Room ${room.roomIndex} must contain eight speakers.` });
    }

    for (const team of room.teams) {
      if (team.speakers.length !== SPEAKERS_PER_TEAM) {
        violations.push({ code: "INVALID_TEAM_SIZE", message: `Team ${team.bpPosition} must contain two speakers.` });
      }

      for (const speaker of team.speakers) {
        if (!participantIds.has(speaker.participantId)) {
          violations.push({ code: "UNKNOWN_PARTICIPANT", message: `Unknown speaker ${speaker.participantId}.` });
        }
        if (assignedParticipants.has(speaker.participantId)) {
          violations.push({ code: "DUPLICATE_ASSIGNMENT", message: `Speaker ${speaker.participantId} is assigned multiple times.` });
        }
        assignedParticipants.add(speaker.participantId);
        speakerAssignments.set(speaker.participantId, {
          roomIndex: room.roomIndex,
          teamKey: `${room.roomIndex}:${team.bpPosition}`,
          speakingRole: speaker.speakingRole,
        });
      }
    }

    if (room.adjudicators.length < 1) {
      violations.push({ code: "MISSING_ADJUDICATOR", message: `Room ${room.roomIndex} must contain at least one adjudicator.` });
    }

    const chairCount = room.adjudicators.filter((adjudicator) => adjudicator.isChair).length;
    if (chairCount !== 1) {
      violations.push({ code: "INVALID_CHAIR_COUNT", message: `Room ${room.roomIndex} must contain exactly one chair.` });
    }

    for (const adjudicator of room.adjudicators) {
      if (!participantIds.has(adjudicator.participantId)) {
        violations.push({ code: "UNKNOWN_ADJUDICATOR", message: `Unknown adjudicator ${adjudicator.participantId}.` });
      }
      if (assignedParticipants.has(adjudicator.participantId)) {
        violations.push({ code: "DUPLICATE_ASSIGNMENT", message: `Adjudicator ${adjudicator.participantId} is assigned multiple times.` });
      }
      assignedParticipants.add(adjudicator.participantId);
    }
  }

  for (const rule of context.rules.timeConstraints.filter((entry) => entry.isStrict)) {
    const assignment = speakerAssignments.get(rule.participantId);
    if (!assignment) {
      violations.push({ code: "STRICT_TIME_CONSTRAINT_UNMET", message: `Participant ${rule.participantId} was not assigned an early speaking role.` });
      continue;
    }
    if (!EARLY_SPEAKING_ROLES.has(assignment.speakingRole)) {
      violations.push({ code: "STRICT_TIME_CONSTRAINT_UNMET", message: `Participant ${rule.participantId} must be assigned PM or LO when marked strict.` });
    }
  }

  for (const rule of context.rules.forcedTeamUps.filter((entry) => entry.isStrict)) {
    const firstAssignment = speakerAssignments.get(rule.firstParticipantId);
    const secondAssignment = speakerAssignments.get(rule.secondParticipantId);
    if (!firstAssignment || !secondAssignment || firstAssignment.teamKey !== secondAssignment.teamKey) {
      violations.push({ code: "STRICT_TEAM_UP_UNMET", message: `Participants ${rule.firstParticipantId} and ${rule.secondParticipantId} must be paired on the same team.` });
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

export function isCandidateValid(candidate: PairingCandidate, context: PairingGenerationContext): boolean {
  return validateHardRules(candidate, context).isValid;
}
