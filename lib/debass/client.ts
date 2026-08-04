import type {
  DebassChatResponse,
  DebassDocumentQueuedResponse,
  DebassDocumentStatusResponse,
  DebassDrillResponse,
  DebassHealthResponse,
  DebassJudgeResponse,
  DebassKeyResponse,
} from "./types";
import { DEBASS_MODEL } from "./types";
import {
  debassChatSchema,
  debassDocumentQueuedSchema,
  debassDocumentStatusSchema,
  debassDrillSchema,
  debassHealthSchema,
  debassJudgeSchema,
  debassKeySchema,
} from "./schemas";
import type { ZodType } from "zod";

export type DebassErrorKind = "unavailable" | "unauthorized" | "rate-limit" | "request" | "cancelled" | "timeout";

export const DEBASS_REQUEST_TIMEOUT_MS = 90_000;
export const DEBASS_HEALTH_TIMEOUT_MS = 10_000;

export class DebassApiError extends Error {
  readonly kind: DebassErrorKind;
  readonly status: number | null;

  constructor(message: string, kind: DebassErrorKind, status: number | null = null) {
    super(message);
    this.name = "DebassApiError";
    this.kind = kind;
    this.status = status;
  }
}

type RequestOptions = {
  body?: BodyInit;
  headers?: HeadersInit;
  method?: "GET" | "POST";
  signal?: AbortSignal;
  timeoutMs?: number;
};

export function hasDebassBackendUrl(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_BACKEND_URL?.trim());
}

function getBackendUrl(): string {
  const configured = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!configured) {
    throw new DebassApiError("Debass backend is not configured.", "unavailable");
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new DebassApiError("Debass backend configuration is invalid.", "unavailable");
  }

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new DebassApiError("Debass requires HTTPS in production.", "unavailable");
  }

  return parsed.toString().replace(/\/+$/, "");
}

async function requestJson<T>(path: string, schema: ZodType<T>, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getBackendUrl();
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requestController = new AbortController();
  let timedOut = false;
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    requestController.abort();
  }, options.timeoutMs ?? DEBASS_REQUEST_TIMEOUT_MS);
  const abortRequest = () => requestController.abort();
  if (options.signal) {
    if (options.signal.aborted) requestController.abort();
    else options.signal.addEventListener("abort", abortRequest, { once: true });
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
      cache: "no-store",
      credentials: "omit",
      signal: requestController.signal,
    });

    const payload = await readPayload(response);
    if (!response.ok) {
      throw createResponseError(response.status, payload);
    }
    try {
      return schema.parse(payload);
    } catch {
      throw new DebassApiError("Debass returned an invalid response.", "request", response.status);
    }
  } catch (caught) {
    if (caught instanceof DebassApiError) throw caught;
    if (timedOut) {
      throw new DebassApiError("The Debass request timed out. Try again.", "timeout");
    }
    if (options.signal?.aborted || (caught instanceof DOMException && caught.name === "AbortError")) {
      throw new DebassApiError("Request cancelled.", "cancelled");
    }
    throw new DebassApiError("Could not reach the Debass service.", "unavailable");
  } finally {
    clearTimeout(timeoutHandle);
    options.signal?.removeEventListener("abort", abortRequest);
  }
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createResponseError(status: number, payload: unknown): DebassApiError {
  const detail = payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
    ? payload.detail
    : null;
  if (status === 401) return new DebassApiError("The Debass service rejected the API key.", "unauthorized", status);
  if (status === 429) return new DebassApiError("The OpenRouter free-tier limit was reached. Try again shortly.", "rate-limit", status);
  if (status === 502 || status === 503 || status === 504) return new DebassApiError("The Debass service is temporarily unavailable.", "unavailable", status);
  if (status >= 500) return new DebassApiError("Debass could not complete that request.", "request", status);
  return new DebassApiError(detail ?? "Debass rejected that request.", "request", status);
}

function authHeaders(apiKey: string, model = DEBASS_MODEL): HeadersInit {
  if (!model.endsWith(":free")) {
    throw new DebassApiError("Only Debass free-tier models are supported.", "request");
  }
  return {
    "X-OpenRouter-Key": apiKey,
    "X-OpenRouter-Model": model,
  };
}

export const debassClient = {
  health(signal?: AbortSignal) {
    return requestJson<DebassHealthResponse>("/health", debassHealthSchema, { signal, timeoutMs: DEBASS_HEALTH_TIMEOUT_MS });
  },

  validateApiKey(apiKey: string, signal?: AbortSignal) {
    // Debass key validation accepts the key in the JSON body; do not duplicate it in a credential header.
    return requestJson<DebassKeyResponse>("/key", debassKeySchema, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey }),
      signal,
    });
  },

  chat(apiKey: string, content: string, signal?: AbortSignal, model = DEBASS_MODEL) {
    return requestJson<DebassChatResponse>("/chat", debassChatSchema, {
      method: "POST",
      headers: { ...authHeaders(apiKey, model), "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
      signal,
    });
  },

  drill(apiKey: string, topic: string, prompt: string, signal?: AbortSignal, model = DEBASS_MODEL) {
    return requestJson<DebassDrillResponse>("/drill", debassDrillSchema, {
      method: "POST",
      headers: { ...authHeaders(apiKey, model), "Content-Type": "application/json" },
      body: JSON.stringify({ topic, prompt }),
      signal,
    });
  },

  judge(apiKey: string, argument: string, signal?: AbortSignal, model = DEBASS_MODEL) {
    return requestJson<DebassJudgeResponse>("/judge", debassJudgeSchema, {
      method: "POST",
      headers: { ...authHeaders(apiKey, model), "Content-Type": "application/json" },
      body: JSON.stringify({ argument, rubric: {} }),
      signal,
    });
  },

  uploadDocument(apiKey: string, file: File, signal?: AbortSignal, model = DEBASS_MODEL) {
    const form = new FormData();
    form.append("file", file);
    return requestJson<DebassDocumentQueuedResponse>("/documents", debassDocumentQueuedSchema, {
      method: "POST",
      headers: authHeaders(apiKey, model),
      body: form,
      signal,
    });
  },

  documentStatus(jobId: string, signal?: AbortSignal) {
    return requestJson<DebassDocumentStatusResponse>(`/documents/${encodeURIComponent(jobId)}`, debassDocumentStatusSchema, { signal });
  },
};
