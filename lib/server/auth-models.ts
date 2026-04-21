import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/server/prisma";
import type { DebsocRole, SessionUser } from "@/lib/server/roles";

type RoleRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  isVerified?: boolean;
};

async function findUserByRole(role: DebsocRole, email: string): Promise<RoleRecord | null> {
  const normalizedEmail = normalizeEmail(email);

  switch (role) {
    case "TechHead":
      return prisma.techHead.findUnique({ where: { email: normalizedEmail } });
    case "President":
      return prisma.president.findUnique({ where: { email: normalizedEmail } });
    case "cabinet":
      return prisma.cabinet.findUnique({ where: { email: normalizedEmail } });
    case "Member":
      return prisma.member.findUnique({ where: { email: normalizedEmail } });
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function authenticateRole(role: DebsocRole, email: string, password: string): Promise<SessionUser | null> {
  const user = await findUserByRole(role, email);

  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    isVerified: role === "TechHead" ? true : Boolean(user.isVerified),
  };
}

export async function findRoleUserByEmail(email: string): Promise<SessionUser | null> {
  const normalizedEmail = normalizeEmail(email);

  const [techHead, president, cabinet, member] = await Promise.all([
    prisma.techHead.findUnique({ where: { email: normalizedEmail } }),
    prisma.president.findUnique({ where: { email: normalizedEmail } }),
    prisma.cabinet.findUnique({ where: { email: normalizedEmail } }),
    prisma.member.findUnique({ where: { email: normalizedEmail } }),
  ]);

  if (techHead) {
    return {
      id: techHead.id,
      name: techHead.name,
      email: techHead.email,
      role: "TechHead",
      isVerified: true,
    };
  }

  if (president) {
    return {
      id: president.id,
      name: president.name,
      email: president.email,
      role: "President",
      isVerified: president.isVerified,
    };
  }

  if (cabinet) {
    return {
      id: cabinet.id,
      name: cabinet.name,
      email: cabinet.email,
      role: "cabinet",
      isVerified: cabinet.isVerified,
    };
  }

  if (member) {
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: "Member",
      isVerified: member.isVerified,
    };
  }

  return null;
}

export async function findRoleUserById(role: DebsocRole, id: string): Promise<SessionUser | null> {
  switch (role) {
    case "TechHead": {
      const techHead = await prisma.techHead.findUnique({ where: { id } });
      return techHead
        ? {
            id: techHead.id,
            name: techHead.name,
            email: techHead.email,
            role,
            isVerified: true,
          }
        : null;
    }
    case "President": {
      const president = await prisma.president.findUnique({ where: { id } });
      return president
        ? {
            id: president.id,
            name: president.name,
            email: president.email,
            role,
            isVerified: president.isVerified,
          }
        : null;
    }
    case "cabinet": {
      const cabinet = await prisma.cabinet.findUnique({ where: { id } });
      return cabinet
        ? {
            id: cabinet.id,
            name: cabinet.name,
            email: cabinet.email,
            role,
            isVerified: cabinet.isVerified,
          }
        : null;
    }
    case "Member": {
      const member = await prisma.member.findUnique({ where: { id } });
      return member
        ? {
            id: member.id,
            name: member.name,
            email: member.email,
            role,
            isVerified: member.isVerified,
          }
        : null;
    }
  }
}

export async function ensureRoleUserByEmail(
  email: string,
  fallbackName?: string | null,
): Promise<SessionUser | null> {
  const normalizedEmail = normalizeEmail(email);
  const existingRoleUser = await findRoleUserByEmail(normalizedEmail);
  if (existingRoleUser) {
    return existingRoleUser;
  }

  const nameFromEmail = normalizedEmail.split("@")[0] || "Member";
  const memberName = fallbackName?.trim() || nameFromEmail;
  const impossiblePassword = await bcrypt.hash(randomUUID(), 10);

  try {
    const member = await prisma.member.create({
      data: {
        name: memberName,
        email: normalizedEmail,
        password: impossiblePassword,
      },
    });

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: "Member",
      isVerified: member.isVerified,
    };
  } catch (error) {
    // If another request created the same member concurrently, reuse it.
    const roleUserAfterFailure = await findRoleUserByEmail(normalizedEmail);
    if (roleUserAfterFailure) {
      return roleUserAfterFailure;
    }

    throw error;
  }
}
