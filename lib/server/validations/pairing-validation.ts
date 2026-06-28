import { z } from "zod";

export const generatePairingSchema = z.object({
  sessionId: z.string().min(1),
});

export const proposalIdParamSchema = z.object({
  proposalId: z.string().min(1),
});

export const pairingSessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
});

export const overrideProposalSchema = z.object({
  overrideType: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  notes: z.string().trim().min(1).nullable().optional(),
});

export const rateProposalSchema = z.object({
  rating: z.number().int().min(0).max(10),
  issueTags: z.array(z.string().min(1)),
  notes: z.string().trim().min(1).nullable().optional(),
});

export const evalReplaySchema = z.object({
  runType: z.enum(["historical_replay", "synthetic_replay"]),
  scenarioSet: z.string().min(1),
  runsPerScenario: z.number().int().min(1),
  baselineVersion: z.string().min(1).nullable(),
});

export const evalCompareSchema = z.object({
  candidateEvalRunId: z.string().min(1),
  baselineEvalRunId: z.string().min(1),
});
