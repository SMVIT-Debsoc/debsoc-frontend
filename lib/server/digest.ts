import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/server/prisma";

/**
 * Cache tag for the single latest digest. The bot's POST handler calls
 * `revalidateTag(DIGEST_TAG)` after each write so the next read is fresh
 * immediately, instead of waiting for the time-based revalidate window.
 */
export const DIGEST_TAG = "digest";

/** A digest is considered expired 24h after it was last written. */
export const DIGEST_TTL_MS = 24 * 60 * 60 * 1000;

export type DigestData = {
  text: string;
  createdAt: Date;
};

/**
 * Cached read of the single digest row (id = 1). The DB is only hit when the
 * cache is cold, when the bot writes (tag revalidation), or when the 1h safety
 * window lapses — not on every page view.
 *
 * IMPORTANT: unstable_cache JSON-serializes its return value, so Dates come
 * back as strings on a cache hit. We therefore cache an ISO string and let the
 * public wrappers rehydrate a real `Date`, so callers never see a string where
 * they expect a Date (which would throw on `.getTime()` / Intl formatting).
 *
 * Expiry is intentionally NOT baked into the cached value. Callers compute it
 * from `createdAt` via `isExpired`, so a cache hit near the 24h boundary still
 * expires correctly.
 */
const readCachedDigest = unstable_cache(
  async (): Promise<{ text: string; createdAtIso: string } | null> => {
    const digest = await prisma.digest.findUnique({ where: { id: 1 } });
    if (!digest) return null;
    return { text: digest.text, createdAtIso: digest.createdAt.toISOString() };
  },
  ["digest:latest"],
  { tags: [DIGEST_TAG], revalidate: 3600 },
);

/** Latest digest with a real `Date`, or null when none exists. */
export async function getLatestDigest(): Promise<DigestData | null> {
  const cached = await readCachedDigest();
  if (!cached) return null;
  return { text: cached.text, createdAt: new Date(cached.createdAtIso) };
}

/** True when a digest written at `createdAt` is older than the 24h TTL. */
export function isExpired(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > DIGEST_TTL_MS;
}

/** Returns the current digest only if present and not expired, else null. */
export async function getActiveDigest(): Promise<DigestData | null> {
  const digest = await getLatestDigest();
  if (!digest || isExpired(digest.createdAt)) return null;
  return digest;
}
