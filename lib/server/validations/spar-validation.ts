import { z } from "zod";

import { benchPositions } from "@/types/pairing";
import {
  apSides,
  getSparRolesForApSide,
  getSparRolesForPosition,
  sparDebateFormats,
  sparParticipantRoles,
  sparSpeakingRoles,
  teamRankToResultPoints,
} from "@/types/spar";

const speakerScoreSchema = z.object({
  speakingRole: z.enum(sparSpeakingRoles),
  speakerScore: z.number().min(50).max(100),
});

const sparTeammateSchema = z.object({
  id: z.string().trim().min(1),
  role: z.enum(sparParticipantRoles),
});

export const submitSparSchema = z.object({
  sparDate: z.coerce.date().refine((value) => value.getTime() <= Date.now(), {
    message: "Spar date cannot be in the future.",
  }),
  motionType: z.string().trim().min(1),
  motionText: z.string().trim().min(1).nullable().optional(),
  debateFormat: z.enum(sparDebateFormats).default("BP"),
  bpPosition: z.enum(benchPositions).nullable().optional(),
  apSide: z.enum(apSides).nullable().optional(),
  isIronMan: z.boolean(),
  teammateId: z.string().trim().min(1).nullable().optional(),
  teammateRole: z.enum(sparParticipantRoles).nullable().optional(),
  teammates: z.array(sparTeammateSchema).max(2).optional(),
  teamRank: z.number().int().min(1).max(4),
  speakerScores: z.array(speakerScoreSchema).min(1).max(3),
}).superRefine((value, context) => {
  const debateFormat = value.debateFormat;
  const teammateId = value.teammateId ?? null;
  const teammateRole = value.teammateRole ?? null;
  const teammates = value.teammates ?? [];
  const normalizedTeammates = teammates.length > 0
    ? teammates
    : teammateId && teammateRole
      ? [{ id: teammateId, role: teammateRole }]
      : [];
  const allowedRoles = new Set(
    debateFormat === "AP"
      ? value.apSide
        ? getSparRolesForApSide(value.apSide)
        : []
      : value.bpPosition
        ? getSparRolesForPosition(value.bpPosition)
        : [],
  );
  const seenRoles = new Set<string>();
  const seenTeammates = new Set<string>();

  if (debateFormat === "BP") {
    if (!value.bpPosition) {
      context.addIssue({ code: "custom", message: "BP spars require a BP position.", path: ["bpPosition"] });
    }
    if (value.apSide) {
      context.addIssue({ code: "custom", message: "BP spars cannot include an AP side.", path: ["apSide"] });
    }
    if (value.teamRank < 1 || value.teamRank > 4) {
      context.addIssue({ code: "custom", message: "BP team rank must be between 1 and 4.", path: ["teamRank"] });
    }
    if (normalizedTeammates.length > 1) {
      context.addIssue({ code: "custom", message: "BP spars can include only one teammate.", path: ["teammates"] });
    }
    if (value.isIronMan) {
      if (normalizedTeammates.length > 0 || teammateId !== null || teammateRole !== null) {
        context.addIssue({ code: "custom", message: "Iron-man spars cannot include teammates.", path: ["teammates"] });
      }
      if (value.speakerScores.length !== 2) {
        context.addIssue({ code: "custom", message: "BP iron-man spars require two speaker scores.", path: ["speakerScores"] });
      }
    } else {
      if (normalizedTeammates.length !== 1) {
        context.addIssue({ code: "custom", message: "Normal BP spars require exactly one teammate.", path: ["teammates"] });
      }
      if (value.speakerScores.length !== 1) {
        context.addIssue({ code: "custom", message: "Normal BP spars require exactly one speaker score.", path: ["speakerScores"] });
      }
    }
  } else {
    if (!value.apSide) {
      context.addIssue({ code: "custom", message: "AP spars require a side.", path: ["apSide"] });
    }
    if (value.bpPosition) {
      context.addIssue({ code: "custom", message: "AP spars cannot include a BP position.", path: ["bpPosition"] });
    }
    if (value.teamRank < 1 || value.teamRank > 2) {
      context.addIssue({ code: "custom", message: "AP team rank must be 1 or 2.", path: ["teamRank"] });
    }
    if (value.isIronMan) {
      if (normalizedTeammates.length > 0 || teammateId !== null || teammateRole !== null) {
        context.addIssue({ code: "custom", message: "AP iron-man spars cannot include teammates.", path: ["teammates"] });
      }
      if (value.speakerScores.length !== 3) {
        context.addIssue({ code: "custom", message: "AP iron-man spars require three speaker scores.", path: ["speakerScores"] });
      }
    } else if (value.speakerScores.length < 1 || value.speakerScores.length > 3) {
      context.addIssue({ code: "custom", message: "AP spars require one to three speaker scores.", path: ["speakerScores"] });
    }
  }

  for (const [index, teammate] of normalizedTeammates.entries()) {
    const key = `${teammate.role}:${teammate.id}`;
    if (seenTeammates.has(key)) {
      context.addIssue({ code: "custom", message: "Teammates cannot be duplicated.", path: ["teammates", index] });
    }
    seenTeammates.add(key);
  }

  for (const [index, score] of value.speakerScores.entries()) {
    if (!allowedRoles.has(score.speakingRole as never)) {
      context.addIssue({
        code: "custom",
        message: `Speaking role ${score.speakingRole} does not match the selected spar format.`,
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
        context.addIssue({ code: "custom", message: "Iron-man spars must include all roles for the selected side/position.", path: ["speakerScores"] });
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

export { getSparRolesForApSide, getSparRolesForPosition, teamRankToResultPoints };