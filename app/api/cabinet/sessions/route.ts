import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({
    roles: ["cabinet", "President", "TechHead"],
    requireVerified: true,
  });
  if ("response" in guard) return guard.response;

  const sessions = await prisma.debateSession.findMany({
    orderBy: { sessionDate: "desc" },
    include: {
      attendance: {
        select: {
          id: true,
          status: true,
          pairingCode: true,
          debatedAlone: true,
          member: { select: { id: true, name: true } },
          cabinet: { select: { id: true, name: true } },
        },
      },
    },
  });
  return ok({ sessions });
}
