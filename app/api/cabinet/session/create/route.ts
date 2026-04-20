import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function POST(request: Request) {
  const guard = await requireSessionUser({ roles: ["cabinet", "President"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const body = await parseJson<{ sessionDate?: string; motiontype?: string; Chair?: string }>(request);
  if (!body.sessionDate || !body.motiontype || !body.Chair) {
    return error("Please provide sessionDate, motiontype, and Chair", 400);
  }

  const parsedDate = new Date(body.sessionDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return error(`Invalid sessionDate format: "${body.sessionDate}". Please use ISO 8601 format.`, 400);
  }

  const session = await prisma.debateSession.create({
    data: {
      sessionDate: parsedDate,
      motiontype: body.motiontype.trim(),
      Chair: body.Chair.trim(),
    },
  });

  return ok({ message: "Session created successfully", session }, { status: 201 });
}
