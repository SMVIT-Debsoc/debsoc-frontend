import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

type AttendanceItem = {
  id: string;
  status: string;
  speakerScore: number | null;
  pairingCode: string | null;
  debatedAlone: boolean;
  session: { id: string; sessionDate: Date | string; motiontype: string; Chair: string };
};

export async function GET() {
  const guard = await requireSessionUser({ roles: ["Member"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const attendance = await prisma.attendance.findMany({
    where: { memberId: guard.user.id },
    select: {
      id: true,
      status: true,
      speakerScore: true,
      pairingCode: true,
      debatedAlone: true,
      session: {
        select: {
          id: true,
          sessionDate: true,
          motiontype: true,
          Chair: true,
        },
      },
    },
  });

  attendance.sort(
    (
      a: { session: { sessionDate: Date | string } },
      b: { session: { sessionDate: Date | string } },
    ) => new Date(b.session.sessionDate).getTime() - new Date(a.session.sessionDate).getTime(),
  );

  const enrichedAttendance = await Promise.all(
    (attendance as AttendanceItem[]).map(async (record: AttendanceItem) => {
      if (!record.pairingCode || record.debatedAlone) {
        return {
          ...record,
          pairedWith: [] as string[],
        };
      }

      const peers = await prisma.attendance.findMany({
        where: {
          sessionId: record.session.id,
          pairingCode: record.pairingCode,
          NOT: { memberId: guard.user.id },
        },
        select: {
          member: { select: { name: true } },
          cabinet: { select: { name: true } },
        },
      });

      return {
        ...record,
        pairedWith: peers
          .map((peer: { member: { name: string } | null; cabinet: { name: string } | null }) => peer.member?.name ?? peer.cabinet?.name ?? null)
          .filter((name: string | null): name is string => Boolean(name)),
      };
    }),
  );

  return ok({ attendance: enrichedAttendance });
}
