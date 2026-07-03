import { requireSessionUser } from "@/lib/server/guards";
import { ok } from "@/lib/server/http";
import { getRealtimeConnectionBootstrap, openRealtimeEventStream } from "@/lib/server/realtime/connection-service";

export async function GET(request: Request) {
  const sessionResult = await requireSessionUser({
    roles: ["Member", "cabinet", "President", "TechHead"],
  });

  if ("response" in sessionResult) {
    return sessionResult.response;
  }

  const acceptHeader = request.headers.get("accept") ?? "";
  const wantsEventStream =
    acceptHeader.includes("text/event-stream") ||
    new URL(request.url).searchParams.get("stream") === "1";

  if (wantsEventStream) {
    return openRealtimeEventStream(sessionResult.user, request.url, request.signal);
  }

  return ok(await getRealtimeConnectionBootstrap(sessionResult.user, request.url), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
