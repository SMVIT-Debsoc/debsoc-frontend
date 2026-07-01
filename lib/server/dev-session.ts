import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/auth";
import type { DebsocRole } from "@/lib/server/roles";

const allowedRoles: DebsocRole[] = ["TechHead", "President", "cabinet", "Member"];

function getDevBypassRole(): DebsocRole {
  const configuredRole = process.env.DEV_AUTH_BYPASS_ROLE;

  if (configuredRole && allowedRoles.includes(configuredRole as DebsocRole)) {
    return configuredRole as DebsocRole;
  }

  return "TechHead";
}

export function getDevBypassSession(): Session | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (process.env.DEV_AUTH_BYPASS !== "true") {
    return null;
  }

  const role = getDevBypassRole();

  return {
    user: {
      id: process.env.DEV_AUTH_BYPASS_ID ?? "dev-user",
      name: process.env.DEV_AUTH_BYPASS_NAME ?? `Local ${role}`,
      email: process.env.DEV_AUTH_BYPASS_EMAIL ?? "local-dev@smvitdebsoc.com",
      role,
      isVerified: process.env.DEV_AUTH_BYPASS_VERIFIED !== "false",
    },
    expires: "9999-12-31T23:59:59.999Z",
  };
}

export async function getAppSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return session;
  }

  return getDevBypassSession();
}
