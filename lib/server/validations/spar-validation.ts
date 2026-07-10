import { z } from "zod";

import { benchPositions, speakingRoles } from "@/types/pairing";
import { sparParticipantRoles, getSparRolesForPosition, teamRankToResultPoints } from "@/types/spar";

const speakerScoreSchema = z.object({
  speakingRole: z.enum(speakingRoles),
  speakerScore: z.number().min(50).max(100),
});

export const submitSparSchema = z.object({
  sparDate: z.coerce.date().refine((value) => value.getTime() <= Date.now(), {
    message: "Spar date cannot be in the future.",
  }),
  motionType: z.string().trim().min(1),
  motionText: z.string().trim().min(1).nullable().optional(),
  bpPosition: z.enum(benchPositions),
  isIronMan: z.boolean(),
  teammateId: z.string().trim().min(1).nullable().optional(),
  teammateRole: z.enum(sparParticipantRoles).nullable().optional(),
  teamRank: z.number().int().min(1).max(4),
  speakerScores: z.array(speakerScoreSchema).min(1).max(2),
}).superRefine((value, context) => {
  const teammateId = value.teammateId ?? null;
  const teammateRole = value.teammateRole ?? null;
  const allowedRoles = new Set(getSparRolesForPosition(value.bpPosition));
  const seenRoles = new Set<string>();

  if (value.isIronMan) {
    if (teammateId !== null || teammateRole !== null) {
      context.addIssue({ code: "custom", message: "Iron-man spars cannot include a teammate.", path: ["teammateId"] });
    }
    if (value.speakerScores.length !== 2) {
      context.addIssue({ code: "custom", message: "Iron-man spars require two speaker scores.", path: ["speakerScores"] });
    }
  } else {
    if (teammateId === null || teammateRole === null) {
      context.addIssue({ code: "custom", message: "Normal spars require a teammate id and role.", path: ["teammateId"] });
    }
    if (value.speakerScores.length !== 1) {
      context.addIssue({ code: "custom", message: "Normal spars require exactly one speaker score.", path: ["speakerScores"] });
    }
  }

  for (const [index, score] of value.speakerScores.entries()) {
    if (!allowedRoles.has(score.speakingRole)) {
      context.addIssue({
        code: "custom",
        message: `Speaking role ${score.speakingRole} does not match ${value.bpPosition} position.`,
        path: ["speakerScores", index, "speakingRole"],
      });
    }
    if (seenRoles.has(score.speakingRole)) {
      context.addIssue({
        code: "custom",
        message: `Speaking role ${score.speakingRole} is duplicated in this spar.`,
        path: ["speakerScores", index, "speakingRole"],
      });
    }
    seenRoles.add(score.speakingRole);
  }

  if (value.isIronMan) {
    for (const role of allowedRoles) {
      if (!seenRoles.has(role)) {
        context.addIssue({ code: "custom", message: "Iron-man spars must include both roles for the selected position.", path: ["speakerScores"] });
      }
    }
  }
});

export const sparHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(["sparDate", "createdAt"]).default("sparDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const sparLeaderboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const sparIdParamSchema = z.object({
  sparId: z.string().min(1),
});

export { getSparRolesForPosition, teamRankToResultPoints };