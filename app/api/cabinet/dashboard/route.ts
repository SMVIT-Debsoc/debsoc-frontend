import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const guard = await requireSessionUser({ roles: ["cabinet", "President"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const [members, cabinet, presidents] = await Promise.all([
    prisma.member.findMany({ select: { id: true, name: true, email: true, isVerified: true } }),
    prisma.cabinet.findMany({
      select: { id: true, name: true, email: true, position: true, isVerified: true },
    }),
    prisma.president.findMany({ select: { id: true, name: true, email: true, isVerified: true } }),
  ]);

  return ok({ members, cabinet, presidents });
}
