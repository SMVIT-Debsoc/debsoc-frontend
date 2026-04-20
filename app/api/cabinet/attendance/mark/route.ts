import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

type AttendanceInput = {
  memberId?: string;
  cabinetId?: string;
  status?: string;
  speakerScore?: number;
};

export async function POST(request: Request) {
  const guard = await requireSessionUser({ roles: ["cabinet", "President"], requireVerified: true });
  if ("response" in guard) return guard.response;

  const body = await parseJson<{ sessionId?: string; attendanceData?: AttendanceInput[] }>(request);
  if (!body.sessionId || !body.attendanceData || !Array.isArray(body.attendanceData)) {
    return error("Please provide sessionId and attendanceData (array)", 400);
  }

  const session = await prisma.debateSession.findUnique({ where: { id: body.sessionId } });
  if (!session) {
    return error("Session not found", 404);
  }

  for (const [index, record] of body.attendanceData.entries()) {
    const hasMemberId = Boolean(record.memberId);
    const hasCabinetId = Boolean(record.cabinetId);

    if (!hasMemberId && !hasCabinetId) {
      return error(`Invalid record at index ${index}: Must provide either memberId or cabinetId`, 400);
    }

    if (hasMemberId && hasCabinetId) {
      return error(`Invalid record at index ${index}: Cannot provide both memberId and cabinetId`, 400);
    }

    if (!record.status || !["Present", "Absent"].includes(record.status)) {
      return error(`Invalid status at index ${index}`, 400);
    }

    if (record.status === "Present" && record.speakerScore !== undefined && typeof record.speakerScore !== "number") {
      return error(`Invalid speakerScore at index ${index}: Must be a number`, 400);
    }
  }

  const result = await prisma.$transaction(async (tx: typeof prisma) =>
    tx.attendance.createMany({
      data: body.attendanceData!.map((record) => ({
        sessionId: body.sessionId!,
        memberId: record.memberId ?? null,
        cabinetId: record.cabinetId ?? null,
        status: record.status!,
        speakerScore: record.speakerScore ?? null,
      })),
    }),
  );

  return ok({ message: "Attendance marked successfully", count: result.count }, { status: 201 });
}
