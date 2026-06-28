import { error } from "@/lib/server/http";

export async function POST() {
  return error("This legacy endpoint has been retired. Use the pairing-system routes instead.", 410, {
    replacement: "/api/sessions/:sessionId and /api/attendance/prepare",
  });
}

