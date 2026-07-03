import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

type AttendanceItem = {
  id: string;
  memberId?: string | null;
  cabinetId?: string | null;
  presidentId?: string | null;
  status: string;
  speakerScore: number | null;
  pairingCode: string | null;
  debatedAlone: boolean;
  session: { id: string; sessionDate: Date | string; motiontype: string; Chair: string };
};

type PublishedSessionItem = {
  id: string;
  sessionDate: Date | string;
  motiontype: string;
  motionType: string | null;
  motionText: string | null;
  Chair: string;
  pairingStatus: string | null;
  publicationStatus: string | null;
  scoringStatus: string | null;
};

type AttendancePeer = {
  memberId?: string | null;
  cabinetId?: string | null;
  presidentId?: string | null;
  member: { name: string } | null;
  cabinet: { name: string } | null;
  president: { name: string } | null;
};

function matchesViewer(peer: AttendancePeer, role: string, viewerId: string) {
  if (role === "cabinet") {
    return peer.cabinetId === viewerId;
  }
  if (role === "President") {
    return peer.presidentId === viewerId;
  }
  return peer.memberId === viewerId;
}

export async function GET() {
  const guard = await requireSessionUser({
    roles: ["Member", "cabinet", "President", "TechHead"],
    requireVerified: true,
  });
  if ("response" in guard) return guard.response;

  if (guard.user.role === "TechHead") {
    return ok({ attendance: [] });
  }

  const where =
    guard.user.role === "cabinet"
      ? { cabinetId: guard.user.id }
      : guard.user.role === "President"
        ? { presidentId: guard.user.id }
        : { memberId: guard.user.id };

  const attendance = await prisma.attendance.findMany({
    where,
    select: {
      id: true,
      memberId: true,
      cabinetId: true,
      presidentId: true,
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

  const publishedSessions = await prisma.debateSession.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      OR: [
        { attendance: { some: where } },
        { sessionRoleAssignments: { some: where } },
        {
          publishedProposal: {
            roomAssignments: {
              some: {
                teamAssignments: {
                  some: {
                    speakerAssignments: {
                      some: where,
                    },
                  },
                },
              },
            },
          },
        },
        {
          publishedProposal: {
            roomAssignments: {
              some: {
                adjudicatorAssignments: {
                  some: where,
                },
              },
            },
          },
        },
      ],
    },
    orderBy: { sessionDate: "desc" },
    select: {
      id: true,
      sessionDate: true,
      motiontype: true,
      motionType: true,
      motionText: true,
      Chair: true,
      pairingStatus: true,
      publicationStatus: true,
      scoringStatus: true,
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
        },
        select: {
          memberId: true,
          cabinetId: true,
          presidentId: true,
          member: { select: { name: true } },
          cabinet: { select: { name: true } },
          president: { select: { name: true } },
        },
      });

      const pairedWith = (peers as AttendancePeer[])
        .filter((peer) => !matchesViewer(peer, guard.user.role, guard.user.id))
        .map((peer) => peer.member?.name ?? peer.cabinet?.name ?? peer.president?.name ?? null)
        .filter((name): name is string => Boolean(name));

      return {
        ...record,
        pairedWith,
      };
    }),
  );

  return ok({
    attendance: enrichedAttendance,
    publishedSessions: (publishedSessions as PublishedSessionItem[]).map((session) => ({
      id: session.id,
      sessionDate: session.sessionDate,
      motiontype: session.motionType ?? session.motiontype,
      motionText: session.motionText,
      Chair: session.Chair,
      pairingStatus: session.pairingStatus,
      publicationStatus: session.publicationStatus,
      scoringStatus: session.scoringStatus,
    })),
  });
}
