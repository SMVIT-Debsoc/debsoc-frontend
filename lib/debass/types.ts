export const DEBASS_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export type DebassHealthResponse = {
  status: string;
  service: string;
};

export type DebassKeyResponse = {
  status: "success" | "invalid" | "unknown";
  message: string;
};

export type DebassChatResponse = {
  content: string;
  citations: string[];
};

export type DebassDrillResponse = {
  response: string;
  feedback: string;
};

export type DebassJudgeResponse = {
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
};

export type DebassDocumentQueuedResponse = {
  job_id: string;
  status: "queued";
};

export type DebassDocumentStatus = "queued" | "parsing" | "embedding" | "done" | "failed";

export type DebassDocumentStatusResponse = {
  job_id: string;
  status: DebassDocumentStatus;
  filename: string;
  node_count: number | null;
  error: string | null;
};
