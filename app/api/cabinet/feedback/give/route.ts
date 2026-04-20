import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: Request) {
  const guard = await requireSessionUser({ roles: ["cabinet"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const body = await parseJson<{ feedback?: string; memberId?: string }>(request);
  if (!body.feedback || !body.memberId) {
    return error("Please provide feedback and memberId", 400);
  }

  const feedback = await prisma.anonymousFeedback.create({
    data: {
      feedback: body.feedback,
      memberId: body.memberId,
      senderType: "cabinet",
      senderCabinetId: guard.user.id,
    },
  });

  return ok({ message: "Anonymous feedback sent successfully", feedback }, { status: 201 });
}
