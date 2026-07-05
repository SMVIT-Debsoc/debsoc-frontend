// Resolve the authenticated realtime user from a raw HTTP upgrade request.
//
// The WebSocket handshake happens outside Next's request scope, so we cannot
// use `getServerSession` / `next/headers` here. next-auth uses the JWT session
// strategy (see auth.ts), so we decode the session cookie directly with
// `getToken`. In development, DEV_AUTH_BYPASS mirrors the HTTP guard's bypass
// (env-only here — no Prisma lookup — to keep this file loadable by the custom
// server without Next's module resolver).

import { getToken } from "next-auth/jwt";
import type { IncomingMessage } from "node:http";
import { canConnectToRealtime } from "./channel-auth.ts";
import type { DebsocRole, SessionUser } from "../roles.ts";

const DEV_BYPASS_ROLES: DebsocRole[] = ["TechHead", "President", "cabinet", "Member"];

function getEnvDevBypassUser(): SessionUser | null {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.DEV_AUTH_BYPASS !== "true") return null;

  const configuredRole = process.env.DEV_AUTH_BYPASS_ROLE as DebsocRole | undefined;
  const role = configuredRole && DEV_BYPASS_ROLES.includes(configuredRole) ? configuredRole : "TechHead";

  return {
    id: process.env.DEV_AUTH_BYPASS_ID?.trim() || "dev-user",
    name: process.env.DEV_AUTH_BYPASS_NAME ?? `Local ${role}`,
    email: process.env.DEV_AUTH_BYPASS_EMAIL ?? "local-dev@smvitdebsoc.com",
    role,
    isVerified: process.env.DEV_AUTH_BYPASS_VERIFIED !== "false",
  };
}

export async function getRealtimeUserFromRequest(req: IncomingMessage): Promise<SessionUser | null> {
  const token = await getToken({
    // getToken only reads `req.headers.cookie` and the secret.
    req: req as unknown as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
  }).catch(() => null);

  let user: SessionUser | null = null;

  if (token?.id && token.role) {
    user = {
      id: String(token.id),
      name: (token.name as string) ?? "",
      email: (token.email as string) ?? "",
      role: token.role as DebsocRole,
      isVerified: Boolean((token as { isVerified?: boolean }).isVerified),
    };
  } else {
    user = getEnvDevBypassUser();
  }

  if (!user || !canConnectToRealtime(user)) {
    return null;
  }

  return user;
}
