import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["cabinet", "President"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const sessions = await prisma.debateSession.findMany({ orderBy: { sessionDate: "desc" } });
  return ok({ sessions });
}
