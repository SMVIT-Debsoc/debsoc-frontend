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

export type DigestRow = {
  id: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Cached read of the single digest row (id = 1). The DB is only hit when the
 * cache is cold, when the bot writes (tag revalidation), or when the 1h safety
 * window lapses — not on every page view.
 *
 * NOTE: expiry is intentionally NOT baked into the cached value. Callers compute
 * it from `createdAt` via `isExpired`, so a cache hit near the 24h boundary
 * still expires correctly.
 */
export const getLatestDigest = unstable_cache(
  async (): Promise<DigestRow | null> => {
    const digest = await prisma.digest.findUnique({ where: { id: 1 } });
    return digest;
  },
  ["digest:latest"],
  { tags: [DIGEST_TAG], revalidate: 3600 },
);

/** True when a digest written at `createdAt` is older than the 24h TTL. */
export function isExpired(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > DIGEST_TTL_MS;
}

/** Returns the current digest only if present and not expired, else null. */
export async function getActiveDigest(): Promise<DigestRow | null> {
  const digest = await getLatestDigest();
  if (!digest || isExpired(digest.createdAt)) return null;
  return digest;
}
