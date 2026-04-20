import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["Member"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const presidents = await prisma.president.findMany({
    select: { id: true, name: true, email: true, isVerified: true },
  });

  return ok({ presidents });
}
