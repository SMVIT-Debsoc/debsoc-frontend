import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { authenticateRole, normalizeEmail } from "@/lib/server/auth-models";
import type { DebsocRole } from "@/lib/server/roles";

export async function registerRole(
  role: "President" | "cabinet" | "Member",
  input: { name?: string; email?: string; password?: string; position?: string },
) {
  const { name, email, password, position } = input;
  const normalizedEmail = email ? normalizeEmail(email) : "";

  if (!name || !email || !password) {
    throw new Error("Please provide all fields");
  }

  if (role === "cabinet" && !position) {
    throw new Error("Please provide all fields");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (role === "President") {
    const existing = await prisma.president.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new Error("President already exists");

    const president = await prisma.president.create({
      data: { name, email: normalizedEmail, password: hashedPassword },
    });

    return {
      message: "President registered successfully",
      user: {
        id: president.id,
        name: president.name,
        email: president.email,
        role,
        isVerified: president.isVerified,
      },
    };
  }

  if (role === "cabinet") {
    const existing = await prisma.cabinet.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new Error("Cabinet member already exists");

    const cabinet = await prisma.cabinet.create({
      data: { name, email: normalizedEmail, password: hashedPassword, position: position! },
    });

    return {
      message: "Cabinet member registered successfully",
      user: {
        id: cabinet.id,
        name: cabinet.name,
        email: cabinet.email,
        role,
        isVerified: cabinet.isVerified,
      },
    };
  }

  const existing = await prisma.member.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new Error("Member already exists");

  const member = await prisma.member.create({
    data: { name, email: normalizedEmail, password: hashedPassword },
  });

  return {
    message: "Member registered successfully",
    user: {
      id: member.id,
      name: member.name,
      email: member.email,
      role,
      isVerified: member.isVerified,
    },
  };
}

export async function loginRole(role: DebsocRole, input: { email?: string; password?: string }) {
  const { email, password } = input;

  if (!email || !password) {
    throw new Error("Please provide email and password");
  }

  const user = await authenticateRole(role, normalizeEmail(email), password);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  return {
    message: "Login successful",
    user,
  };
}

export async function verifyEntity(
  entity: "president" | "cabinet" | "member",
  entityId: string,
  techHeadId: string,
) {
  if (!entityId) {
    throw new Error(
      entity === "president"
        ? "President ID is required"
        : entity === "cabinet"
          ? "Cabinet ID is required"
          : "Member ID is required",
    );
  }

  if (entity === "president") {
    const president = await prisma.president.findUnique({ where: { id: entityId } });
    if (!president) throw new Error("President not found");
    if (president.isVerified) throw new Error("President is already verified");

    const updated = await prisma.president.update({
      where: { id: entityId },
      data: { isVerified: true, verifiedByTechHeadId: techHeadId },
    });

    return {
      message: "President verified successfully",
      president: { id: updated.id, name: updated.name, isVerified: updated.isVerified },
    };
  }

  if (entity === "cabinet") {
    const cabinet = await prisma.cabinet.findUnique({ where: { id: entityId } });
    if (!cabinet) throw new Error("Cabinet member not found");
    if (cabinet.isVerified) throw new Error("Cabinet member is already verified");

    const updated = await prisma.cabinet.update({
      where: { id: entityId },
      data: { isVerified: true, verifiedByTechHeadId: techHeadId },
    });

    return {
      message: "Cabinet member verified successfully",
      cabinet: { id: updated.id, name: updated.name, isVerified: updated.isVerified },
    };
  }

  const member = await prisma.member.findUnique({ where: { id: entityId } });
  if (!member) throw new Error("Member not found");
  if (member.isVerified) throw new Error("Member is already verified");

  const updated = await prisma.member.update({
    where: { id: entityId },
    data: { isVerified: true, verifiedByTechHeadId: techHeadId },
  });

  return {
    message: "Member verified successfully",
    member: { id: updated.id, name: updated.name, isVerified: updated.isVerified },
  };
}

export async function unverifyEntity(
  entity: "president" | "cabinet" | "member",
  entityId: string,
) {
  if (!entityId) {
    throw new Error(
      entity === "president"
        ? "President ID is required"
        : entity === "cabinet"
          ? "Cabinet ID is required"
          : "Member ID is required",
    );
  }

  if (entity === "president") {
    const president = await prisma.president.findUnique({ where: { id: entityId } });
    if (!president) throw new Error("President not found");
    if (!president.isVerified) throw new Error("President is not verified");

    const updated = await prisma.president.update({
      where: { id: entityId },
      data: { isVerified: false, verifiedByTechHeadId: null },
    });

    return {
      message: "President unverified successfully",
      president: { id: updated.id, name: updated.name, isVerified: updated.isVerified },
    };
  }

  if (entity === "cabinet") {
    const cabinet = await prisma.cabinet.findUnique({ where: { id: entityId } });
    if (!cabinet) throw new Error("Cabinet member not found");
    if (!cabinet.isVerified) throw new Error("Cabinet member is not verified");

    const updated = await prisma.cabinet.update({
      where: { id: entityId },
      data: { isVerified: false, verifiedByTechHeadId: null },
    });

    return {
      message: "Cabinet member unverified successfully",
      cabinet: { id: updated.id, name: updated.name, isVerified: updated.isVerified },
    };
  }

  const member = await prisma.member.findUnique({ where: { id: entityId } });
  if (!member) throw new Error("Member not found");
  if (!member.isVerified) throw new Error("Member is not verified");

  const updated = await prisma.member.update({
    where: { id: entityId },
    data: { isVerified: false, verifiedByTechHeadId: null },
  });

  return {
    message: "Member unverified successfully",
    member: { id: updated.id, name: updated.name, isVerified: updated.isVerified },
  };
}

export async function deleteEntity(entity: "president" | "cabinet" | "member", id: string) {
  if (!id) {
    throw new Error("ID is required");
  }

  if (entity === "president") {
    await prisma.president.delete({ where: { id } });
    return { message: "President removed successfully" };
  }

  if (entity === "cabinet") {
    await prisma.cabinet.delete({ where: { id } });
    return { message: "Cabinet member removed successfully" };
  }

  await prisma.member.delete({ where: { id } });
  return { message: "Member removed successfully" };
}

export async function getUnverifiedUsers() {
  const [unverifiedPresidents, unverifiedCabinet, unverifiedMembers] = await Promise.all([
    prisma.president.findMany({
      where: { isVerified: false },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.cabinet.findMany({
      where: { isVerified: false },
      select: { id: true, name: true, email: true, position: true, createdAt: true },
    }),
    prisma.member.findMany({
      where: { isVerified: false },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  return { unverifiedPresidents, unverifiedCabinet, unverifiedMembers };
}

export async function getVerifiedUsers() {
  const [verifiedPresidents, verifiedCabinet, verifiedMembers] = await Promise.all([
    prisma.president.findMany({
      where: { isVerified: true },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.cabinet.findMany({
      where: { isVerified: true },
      select: { id: true, name: true, email: true, position: true, createdAt: true },
    }),
    prisma.member.findMany({
      where: { isVerified: true },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ]);

  return { verifiedPresidents, verifiedCabinet, verifiedMembers };
}
