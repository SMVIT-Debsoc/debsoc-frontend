import { requireSessionUser } from "@/lib/server/guards";
import { ok } from "@/lib/server/http";
import { getRealtimeConnectionBootstrap, openRealtimeEventStream } from "@/lib/server/realtime/connection-service";
import { isDemoDataEnabled } from "@/lib/server/demo-data";

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

  // Demo sessions are deterministic fixtures and do not exist in the database.
  // Keep the client subscription alive without asking Prisma to resolve them.
  if (isDemoDataEnabled()) {
    if (wantsEventStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(": demo realtime stream\n\n"));
          const timer = setInterval(() => controller.enqueue(encoder.encode(": heartbeat\n\n")), 20_000);
          request.signal.addEventListener("abort", () => {
            clearInterval(timer);
            controller.close();
          }, { once: true });
        },
      });
      return new Response(stream, { headers: { "Cache-Control": "no-store, no-transform", Connection: "keep-alive", "Content-Type": "text/event-stream; charset=utf-8" } });
    }
    return ok({ connectionId: "demo-connection", allowedScopes: [], transport: "sse", reconnectStrategy: { mode: "manual" } }, { headers: { "Cache-Control": "no-store" } });
  }

  if (wantsEventStream) {
    return openRealtimeEventStream(sessionResult.user, request.url, request.signal);
  }

  return ok(await getRealtimeConnectionBootstrap(sessionResult.user, request.url), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
