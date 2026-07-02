import { z } from "zod";

import { pairingObjectives } from "@/types/pairing";
import { sessionRoles } from "@/types/session";

const timeConstraintSchema = z.object({
  participantId: z.string().min(1),
  isStrict: z.boolean(),
});

const eventTeamUpPreferenceSchema = z.object({
  firstParticipantId: z.string().min(1),
  secondParticipantId: z.string().min(1),
  isStrict: z.boolean(),
}).refine((value) => value.firstParticipantId !== value.secondParticipantId, {
  message: "Team-up participants must be different.",
  path: ["secondParticipantId"],
});

export const sessionRulesSchema = z.object({
  timeConstraints: z.array(timeConstraintSchema),
  eventTeamUpPreferences: z.array(eventTeamUpPreferenceSchema),
});

export const attendancePreparationSchema = z.object({
  sessionId: z.string().min(1),
});

export const createSessionSchema = z.object({
  sessionDate: z.string().datetime().optional(),
  motionType: z.string().min(1).optional(),
  motionText: z.string().min(1).optional(),
  pairingObjective: z.enum(pairingObjectives).optional(),
  chair: z.string().min(1).optional(),
  sessionRules: sessionRulesSchema.optional(),
});

export const markAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  entries: z.array(
    z.object({
      participantId: z.string().min(1),
      isPresent: z.boolean(),
      sessionRole: z.enum(sessionRoles),
    }),
  ),
});

export const updateSessionSchema = z.object({
  motionType: z.string().min(1),
  motionText: z.string().min(1),
  pairingObjective: z.enum(pairingObjectives),
  pairingStatus: z.string().min(1).optional(),
  sessionRules: sessionRulesSchema.optional(),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
});

export const participantIdParamSchema = z.object({
  participantId: z.string().min(1),
});
