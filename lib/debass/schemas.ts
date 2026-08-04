import { z } from "zod";

const documentStatus = z.enum(["queued", "parsing", "embedding", "done", "failed"]);

export const debassHealthSchema = z.object({
  status: z.string().min(1),
  service: z.string().min(1),
});

export const debassKeySchema = z.object({
  status: z.enum(["success", "invalid", "unknown"]),
  message: z.string().optional().default(""),
});

export const debassChatSchema = z.object({
  content: z.string(),
  citations: z.array(z.string()).optional().default([]),
});

export const debassDrillSchema = z.object({
  response: z.string(),
  feedback: z.string(),
});

export const debassJudgeSchema = z.object({
  score: z.number().finite(),
  reasoning: z.string(),
  strengths: z.array(z.string()).optional().default([]),
  weaknesses: z.array(z.string()).optional().default([]),
});

export const debassDocumentQueuedSchema = z.object({
  job_id: z.string().min(1),
  status: z.literal("queued"),
});

export const debassDocumentStatusSchema = z.object({
  job_id: z.string().min(1),
  status: documentStatus,
  filename: z.string().min(1),
  node_count: z.number().int().nonnegative().nullable().optional().default(null),
  error: z.string().nullable().optional().default(null),
});
