import { error } from "@/lib/server/http";

type AttendanceItem = {
  id: string;
  status: string;
  speakerScore: number | null;
  pairingCode: string | null;
  debatedAlone: boolean;
  session: { id: string; sessionDate: Date | string; motiontype: string; Chair: string };
};

type AttendancePeer = {
  cabinetId: string | null;
  member: { name: string } | null;
  cabinet: { name: string } | null;
};

export async function GET() {
  return error("This legacy endpoint has been retired. Use the pairing-system routes instead.", 410, {
    replacement: "/api/sessions/:sessionId",
  });
}

