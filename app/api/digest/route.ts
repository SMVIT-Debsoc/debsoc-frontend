import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { ok, error, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";
import { DIGEST_TAG, getLatestDigest, isExpired } from "@/lib/server/digest";

export const runtime = "nodejs";

const bodySchema = z.object({
  text: z.string().trim().min(1, "text is required"),
});

/** Constant-time comparison that first guards against length leakage. */
function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * POST /api/digest — machine endpoint for the digest bot.
 * Auth is the Bearer secret ONLY (no session). Upserts the single digest row.
 */
export async function POST(request: Request) {
  const secret = process.env.WEBSITE_DIGEST_SECRET;
  if (!secret) {
    // Fail closed: never accept writes when the secret isn't configured.
    return error("Digest endpoint not configured", 500);
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  const provided = match?.[1]?.trim();
  if (!provided || !tokensMatch(provided, secret)) {
    return error("Unauthorized", 401);
  }

  let payload: unknown;
  try {
    payload = await parseJson<unknown>(request);
  } catch {
    return error("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return error("Invalid body", 400, { issues: parsed.error.issues });
  }

  await prisma.digest.upsert({
    where: { id: 1 },
    create: { id: 1, text: parsed.data.text },
    // Reset createdAt so the 24h expiry clock restarts on every write.
    update: { text: parsed.data.text, createdAt: new Date() },
  });

  // Invalidate the cached read so members see the new digest immediately.
  // Next 16 requires a cache-life profile as the second argument; "max" gives
  // the longest stale-while-revalidate window.
  revalidateTag(DIGEST_TAG, "max");

  return ok({ ok: true });
}

/**
 * GET /api/digest — role-gated read for club members. Returns the latest digest
 * unless it's missing or older than 24h, in which case `digest` is null.
 */
export async function GET() {
  const guard = await requireSessionUser({
    roles: ["Member", "cabinet", "President", "TechHead"],
    requireVerified: true,
  });
  if ("response" in guard) return guard.response;

  const digest = await getLatestDigest();
  if (!digest || isExpired(digest.createdAt)) {
    return ok({ digest: null });
  }

  return ok({
    digest: { text: digest.text, updatedAt: digest.createdAt.toISOString() },
  });
}
