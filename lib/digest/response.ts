export type DigestApiResponse = {
  digest: { text: string; updatedAt: string } | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate the untrusted API response before it enters Digest render state. */
export function normalizeDigestResponse(value: unknown): DigestApiResponse | null {
  if (!isRecord(value) || !("digest" in value)) return null;

  if (value.digest === null) return { digest: null };
  if (!isRecord(value.digest)) return null;

  const text = value.digest.text;
  const updatedAt = value.digest.updatedAt;
  if (typeof text !== "string" || typeof updatedAt !== "string") return null;
  if (Number.isNaN(new Date(updatedAt).getTime())) return null;

  return { digest: { text, updatedAt } };
}
