import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["cabinet", "President"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const where =
    guard.user.role === "cabinet" ? { senderCabinetId: guard.user.id } : {};

  const messages = await prisma.anonymousMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { president: { select: { name: true, email: true } } },
  });

  return ok({ messages });
}
