import type { DebassErrorKind } from "./client";

export type DebassErrorContext = "validation" | "chat" | "drill" | "judge" | "document";

const DEFAULT_MESSAGES: Record<DebassErrorContext, string> = {
  validation: "Your API key could not be validated. Check it and try again.",
  chat: "We couldn't connect to DebSoc AI. Please try again.",
  drill: "DebSoc AI couldn't prepare the drill analysis. Please try again.",
  judge: "DebSoc AI couldn't review the argument. Please try again.",
  document: "The document request could not be completed. Please try again.",
};

function messageForKind(kind: DebassErrorKind, context: DebassErrorContext): string {
  if (kind === "cancelled") return "Request cancelled.";
  if (kind === "timeout") return "The request took too long. Please try again.";
  if (kind === "rate-limit") return "DebSoc AI is temporarily busy. Please try again shortly.";
  if (kind === "unavailable") return "We couldn't connect to DebSoc AI. Please try again.";
  if (kind === "unauthorized") {
    return context === "validation"
      ? "Your API key could not be validated. Check it and try again."
      : "DebSoc AI could not authorize that request. Check your connection and try again.";
  }
  return DEFAULT_MESSAGES[context];
}

/**
 * Convert Debass failures to bounded UI copy. Deliberately never reads Error.message:
 * backend detail strings can contain provider, model, request, or credential data.
 */
export function safeDebassErrorMessage(error: unknown, context: DebassErrorContext): string {
  if (error instanceof Error && error.name === "DebassApiError" && typeof (error as Error & { kind?: unknown }).kind === "string") {
    return messageForKind((error as Error & { kind: DebassErrorKind }).kind, context);
  }
  if (error instanceof DOMException && error.name === "AbortError") return "Request cancelled.";
  return DEFAULT_MESSAGES[context];
}
