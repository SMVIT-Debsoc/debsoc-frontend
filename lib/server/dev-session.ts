import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/server/prisma";
import type { DebsocRole } from "@/lib/server/roles";

const allowedRoles: DebsocRole[] = ["TechHead", "President", "cabinet", "Member"];

function getDevBypassRole(): DebsocRole {
  const configuredRole = process.env.DEV_AUTH_BYPASS_ROLE;

  if (configuredRole && allowedRoles.includes(configuredRole as DebsocRole)) {
    return configuredRole as DebsocRole;
  }

  return "TechHead";
}

async function resolveDevBypassId(role: DebsocRole) {
  const configuredId = process.env.DEV_AUTH_BYPASS_ID;
  if (configuredId && configuredId.trim()) {
    return configuredId;
  }

  const configuredEmail = process.env.DEV_AUTH_BYPASS_EMAIL?.trim();
  const configuredName = process.env.DEV_AUTH_BYPASS_NAME?.trim();

  if (role === "cabinet") {
    const match = await prisma.cabinet.findFirst({
      where: {
        OR: [
          ...(configuredEmail ? [{ email: configuredEmail }] : []),
          ...(configuredName ? [{ name: configuredName }] : []),
          { email: "mobasshirkhan9931@gmail.com" },
        ],
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return match?.id ?? "dev-user";
  }

  if (role === "Member") {
    const match = await prisma.member.findFirst({
      where: {
        OR: [
          ...(configuredEmail ? [{ email: configuredEmail }] : []),
          ...(configuredName ? [{ name: configuredName }] : []),
        ],
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return match?.id ?? "dev-user";
  }

  if (role === "President") {
    const match = await prisma.president.findFirst({
      where: {
        OR: [
          ...(configuredEmail ? [{ email: configuredEmail }] : []),
          ...(configuredName ? [{ name: configuredName }] : []),
        ],
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    return match?.id ?? "dev-user";
  }

  if (role === "TechHead") {
    const match = await prisma.techHead.findFirst({
      where: {
        OR: [
          ...(configuredEmail ? [{ email: configuredEmail }] : []),
          ...(configuredName ? [{ name: configuredName }] : []),
        ],
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (!match) {
      // Fallback: grab any TechHead record
      const any = await prisma.techHead.findFirst({ select: { id: true } });
      return any?.id ?? "dev-user";
    }
    return match.id;
  }

  return configuredId ?? "dev-user";
}

export async function getDevBypassSession(): Promise<Session | null> {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (process.env.DEV_AUTH_BYPASS !== "true") {
    return null;
  }

  const role = getDevBypassRole();
  const resolvedId = await resolveDevBypassId(role);

  return {
    user: {
      id: resolvedId,
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
