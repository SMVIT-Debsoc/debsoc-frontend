import { error, ok, parseJson } from "@/lib/server/http";
import { requireSessionUser } from "@/lib/server/guards";
import { prisma } from "@/lib/server/prisma";

type AttendanceInput = {
  memberId?: string;
  cabinetId?: string;
  status?: string;
  speakerScore?: number;
  pairingCode?: string;
  debatedAlone?: boolean;
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

    if (record.pairingCode !== undefined && typeof record.pairingCode !== "string") {
      return error(`Invalid pairingCode at index ${index}: Must be a string`, 400);
    }

    if (record.debatedAlone !== undefined && typeof record.debatedAlone !== "boolean") {
      return error(`Invalid debatedAlone at index ${index}: Must be a boolean`, 400);
    }
  }

  // Pairing validation rules per session payload:
  // - Optional for everyone.
  // - If debatedAlone is true, pairingCode must be empty.
  // - For present participants with a pairingCode, group size must be 2 or 3.
  const pairingCounts = new Map<string, number>();
  const pairingSoloFlags = new Map<string, boolean[]>();
  for (const record of body.attendanceData) {
    if (record.status !== "Present") continue;

    const trimmedPairingCode = record.pairingCode?.trim() ?? "";
    const debatedAlone = Boolean(record.debatedAlone);

    if (debatedAlone && trimmedPairingCode) {
      return error("A participant marked as debated alone cannot have a pairing code.", 400);
    }

    if (!debatedAlone && trimmedPairingCode) {
      pairingCounts.set(trimmedPairingCode, (pairingCounts.get(trimmedPairingCode) ?? 0) + 1);
      pairingSoloFlags.set(trimmedPairingCode, [...(pairingSoloFlags.get(trimmedPairingCode) ?? []), debatedAlone]);
    }
  }

  for (const [pairingCode, count] of pairingCounts.entries()) {
    if (count !== 2 && count !== 3) {
      return error(
        `Pairing "${pairingCode}" must have exactly 2 participants (BP) or 3 participants (AP).`,
        400,
      );
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
        pairingCode: record.pairingCode?.trim() || null,
        debatedAlone: Boolean(record.debatedAlone),
      })),
    }),
  );

  return ok({ message: "Attendance marked successfully", count: result.count }, { status: 201 });
}
