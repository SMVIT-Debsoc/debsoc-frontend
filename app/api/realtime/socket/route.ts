import { requireSessionUser } from "@/lib/server/guards";
import { ok } from "@/lib/server/http";
import { acceptRealtimeConnection } from "@/lib/server/realtime/websocket-hub";

export async function GET() {
  const sessionResult = await requireSessionUser({
    roles: ["Member", "cabinet", "President", "TechHead"],
  });

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const connection = acceptRealtimeConnection({
    user: sessionResult.user,
  });

  return ok(connection, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
