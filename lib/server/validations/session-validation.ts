import { z } from "zod";

import { pairingObjectives } from "@/types/pairing";
import { sessionRoles } from "@/types/session";

export const attendancePreparationSchema = z.object({
  sessionId: z.string().min(1),
});

export const createSessionSchema = z.object({
  sessionDate: z.string().datetime().optional(),
  motionType: z.string().min(1).optional(),
  motionText: z.string().min(1).optional(),
  pairingObjective: z.enum(pairingObjectives).optional(),
  chair: z.string().min(1).optional(),
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
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
});

export const participantIdParamSchema = z.object({
  participantId: z.string().min(1),
});
