import { z } from "zod";

import { benchPositions, speakingRoles } from "@/types/pairing";

export const speakerScoringSchema = z.object({
  sessionId: z.string().min(1),
  chairScore: z.number().int().min(0).max(10),
  teamDynamicsRating: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional(),
});

export const chairScoringSchema = z.object({
  sessionId: z.string().min(1),
  adjudicatorScores: z.array(
    z.object({
      adjudicatorMemberId: z.string().min(1),
      rating: z.number().int().min(0).max(10),
      notes: z.string().trim().min(1).nullable().optional(),
    }),
  ),
  speakerScores: z.array(
    z.object({
      memberId: z.string().min(1),
      rawScore: z.number().int().min(0),
      bpPosition: z.enum(benchPositions),
      speakingRole: z.enum(speakingRoles),
      teamResultPoints: z.number().int().min(0).max(3),
    }),
  ),
});
