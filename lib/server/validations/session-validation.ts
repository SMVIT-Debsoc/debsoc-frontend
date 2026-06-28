import { z } from "zod";

import { pairingObjectives } from "@/types/pairing";
import { sessionRoles } from "@/types/session";

export const attendancePreparationSchema = z.object({
  sessionId: z.string().min(1),
});

export const markAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  entries: z.array(
    z.object({
      memberId: z.string().min(1),
      isPresent: z.boolean(),
      sessionRole: z.enum(sessionRoles),
    }),
  ),
});

export const updateSessionSchema = z.object({
  motionType: z.string().min(1),
  motionText: z.string().min(1),
  pairingObjective: z.enum(pairingObjectives),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
});

export const participantIdParamSchema = z.object({
  participantId: z.string().min(1),
});
