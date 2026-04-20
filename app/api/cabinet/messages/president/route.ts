import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: Request) {
  const guard = await requireSessionUser({ roles: ["cabinet"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const body = await parseJson<{ message?: string; presidentId?: string }>(request);
  if (!body.message || !body.presidentId) {
    return error("Please provide message and presidentId", 400);
  }

  const data = await prisma.anonymousMessage.create({
    data: {
      message: body.message,
      presidentId: body.presidentId,
      senderType: "cabinet",
      senderCabinetId: guard.user.id,
    },
  });

  return ok({ message: "Anonymous message sent to President successfully", data }, { status: 201 });
}
