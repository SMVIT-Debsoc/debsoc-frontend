import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["cabinet", "President"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const tasks =
    guard.user.role === "cabinet"
      ? await prisma.task.findMany({ where: { assignedToId: guard.user.id } })
      : await prisma.task.findMany();

  return ok({ tasks });
}
