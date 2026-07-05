// Custom Next.js server that adds a real WebSocket transport for the pairing
// realtime system, alongside the existing SSE route (/api/realtime/socket).
//
// Next App Router route handlers cannot perform a WebSocket `upgrade`, so the
// socket is terminated here and wired into the SAME realtime hub/broker used by
// SSE (openRealtimeWebSocketConnection). Non-matching upgrades (e.g. Next dev
// HMR) are forwarded to Next so hot-reload keeps working.
//
// Run: `npm run dev` (development) / `npm run build && npm start` (production).

import { createServer } from "node:http";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import { getRealtimeUserFromRequest } from "./lib/server/realtime/ws-auth.ts";
import { openRealtimeWebSocketConnection } from "./lib/server/realtime/connection-service.ts";

const WS_PATH = "/api/realtime/ws";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const dev = process.env.NODE_ENV !== "production";

async function main() {
  const app = next({ dev });
  await app.prepare();
  const handle = app.getRequestHandler();
  const upgradeHandler = app.getUpgradeHandler();

  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

    // Forward everything that is not our realtime socket (Next dev HMR, etc.).
    if (pathname !== WS_PATH) {
      upgradeHandler(req, socket, head);
      return;
    }

    wss.handleUpgrade(req, socket, head, async (ws) => {
      const user = await getRealtimeUserFromRequest(req);
      if (!user) {
        ws.close(1008, "Unauthorized");
        return;
      }

      const requestUrl = `http://localhost${req.url ?? WS_PATH}`;
      try {
        const connection = await openRealtimeWebSocketConnection(user, requestUrl, {
          send(event, data) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ event, data }));
            }
          },
          isOpen() {
            return ws.readyState === WebSocket.OPEN;
          },
        });

        ws.on("close", () => connection.dispose());
        ws.on("error", () => connection.dispose());
      } catch (error) {
        console.error("[ws] realtime connection setup failed", error);
        ws.close(1011, "Realtime setup failed");
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}  (ws ${WS_PATH})`);
  });
}

main().catch((error) => {
  console.error("[server] fatal", error);
  process.exit(1);
});
