import { ok } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

type ScoreRecord = { speakerScore: number | null };
type LeaderboardEntity = { id: string; name: string; attendance: ScoreRecord[] };

export async function GET(request: Request) {
  const guard = await requireSessionUser({
    roles: ["Member", "cabinet", "President", "TechHead"],
  });
  if ("response" in guard) return guard.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let dateFilter = {};
  if (type === "bi-monthly") {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    dateFilter = {
      session: {
        sessionDate: {
          gte: twoMonthsAgo,
        },
      },
    };
  }

  const [allMembers, allCabinet] = await Promise.all([
    prisma.member.findMany({
      select: {
        id: true,
        name: true,
        attendance: {
          select: { speakerScore: true },
          where: { status: "Present", ...dateFilter },
        },
      },
    }),
    prisma.cabinet.findMany({
      select: {
        id: true,
        name: true,
        attendance: {
          select: { speakerScore: true },
          where: { status: "Present", ...dateFilter },
        },
      },
    }),
  ]);

  const leaderboard = [
    ...(allMembers as LeaderboardEntity[]).map((member) => ({
      id: member.id,
      name: member.name,
      type: "Member",
      score: member.attendance.reduce(
        (sum: number, record: ScoreRecord) => sum + (record.speakerScore || 0),
        0,
      ),
      sessions: member.attendance.length,
    })),
    ...(allCabinet as LeaderboardEntity[]).map((cabinet) => ({
      id: cabinet.id,
      name: cabinet.name,
      type: "Cabinet",
      score: cabinet.attendance.reduce(
        (sum: number, record: ScoreRecord) => sum + (record.speakerScore || 0),
        0,
      ),
      sessions: cabinet.attendance.length,
    })),
  ]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return ok({ leaderboard });
}
