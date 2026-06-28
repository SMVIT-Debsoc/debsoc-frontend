import { error } from "@/lib/server/http";

export async function GET() {
  return error("This legacy endpoint has been retired. Use the pairing-system routes instead.", 410, {
    replacement: "/api/progress/members/:participantId",
  });
}

export async function PATCH() {
  return error("This legacy endpoint has been retired. Use the pairing-system routes instead.", 410, {
    replacement: "/api/progress/members/:participantId",
  });
}

