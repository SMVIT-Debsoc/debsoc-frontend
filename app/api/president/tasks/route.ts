import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["President"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { id: true, name: true, email: true, position: true } },
      assignedToMember: { select: { id: true, name: true, email: true } },
    },
  });

  return ok({ tasks });
}
