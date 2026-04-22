import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["Member"], requireVerified: true });
  if ("response" in guard) return guard.response;

  try {
    const feedbacks = await prisma.anonymousFeedback.findMany({
      where: { memberId: guard.user.id },
      select: { id: true, feedback: true, senderType: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return ok({ feedbacks });
  } catch (primaryError) {
    console.error("[member/feedback] primary query failed", primaryError);
    try {
      const feedbacks = await prisma.anonymousFeedback.findMany({
        where: { memberId: guard.user.id },
        select: { id: true, feedback: true, senderType: true, createdAt: true },
      });
      return ok({ feedbacks });
    } catch (fallbackError) {
      console.error("[member/feedback] fallback query failed", fallbackError);
      return ok({ feedbacks: [] });
    }
  }
}
