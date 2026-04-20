import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["President"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const messages = await prisma.anonymousMessage.findMany({
    where: { presidentId: guard.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      presidentId: true,
      senderType: true,
      createdAt: true,
    },
  });

  return ok({ messages });
}
