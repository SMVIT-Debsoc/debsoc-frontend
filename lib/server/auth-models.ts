import bcrypt from "bcryptjs";
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
  switch (role) {
    case "TechHead":
      return prisma.techHead.findUnique({ where: { email } });
    case "President":
      return prisma.president.findUnique({ where: { email } });
    case "cabinet":
      return prisma.cabinet.findUnique({ where: { email } });
    case "Member":
      return prisma.member.findUnique({ where: { email } });
  }
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
  const techHead = await prisma.techHead.findUnique({ where: { email } });
  if (techHead) {
    return {
      id: techHead.id,
      name: techHead.name,
      email: techHead.email,
      role: "TechHead",
      isVerified: true,
    };
  }

  const president = await prisma.president.findUnique({ where: { email } });
  if (president) {
    return {
      id: president.id,
      name: president.name,
      email: president.email,
      role: "President",
      isVerified: president.isVerified,
    };
  }

  const cabinet = await prisma.cabinet.findUnique({ where: { email } });
  if (cabinet) {
    return {
      id: cabinet.id,
      name: cabinet.name,
      email: cabinet.email,
      role: "cabinet",
      isVerified: cabinet.isVerified,
    };
  }

  const member = await prisma.member.findUnique({ where: { email } });
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
