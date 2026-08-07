import bcrypt from "bcryptjs";
import type {Prisma} from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { authenticateRole, normalizeEmail } from "@/lib/server/auth-models";
import type { DebsocRole } from "@/lib/server/roles";
import { getOrLoad, invalidateTags } from "@/lib/server/cache/cache";
import { CACHE_TAGS, cacheKeys } from "@/lib/server/cache/keys";
import {migrateParticipantReferences, type RoleKey} from "@/lib/server/techhead/role-migration";

// Roster mutations (register/verify/unverify/delete/role-change) all alter the
// members/cabinet/presidents lists the dashboard bootstrap reads, so each
// wrapped export drops the `roster` cache tag after a successful write.
async function withRosterInvalidation<T>(run: () => Promise<T>): Promise<T> {
  const result = await run();
  await invalidateTags([CACHE_TAGS.roster]);
  return result;
}

export const registerRole: typeof registerRoleImpl = (...args) =>
  withRosterInvalidation(() => registerRoleImpl(...args));
export const verifyEntity: typeof verifyEntityImpl = (...args) =>
  withRosterInvalidation(() => verifyEntityImpl(...args));
export const unverifyEntity: typeof unverifyEntityImpl = (...args) =>
  withRosterInvalidation(() => unverifyEntityImpl(...args));
export const deleteEntity: typeof deleteEntityImpl = (...args) =>
  withRosterInvalidation(() => deleteEntityImpl(...args));
export const changeEntityRole: typeof changeEntityRoleImpl = (...args) =>
  withRosterInvalidation(() => changeEntityRoleImpl(...args));

async function registerRoleImpl(
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

async function verifyEntityImpl(
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

async function unverifyEntityImpl(
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

async function deleteEntityImpl(entity: "president" | "cabinet" | "member", id: string) {
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

async function changeEntityRoleImpl(
  fromRole: RoleKey,
  toRole: RoleKey,
  id: string,
  options: { position?: string; techHeadId: string },
) {
  if (!id) throw new Error("User ID is required");
  if (!options.techHeadId) throw new Error("TechHead authorization is required");
  if (fromRole === toRole) throw new Error("Source and target roles are the same");
  if (toRole === "cabinet" && !options.position?.trim()) {
    throw new Error("A cabinet position is required when promoting or demoting to cabinet");
  }

  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const actor = await tx.techHead.findUnique({
        where: {id: options.techHeadId},
        select: {id: true},
      });
      if (!actor) throw new Error("TechHead authorization is invalid");

      const source =
        fromRole === "president"
          ? await tx.president.findUnique({where: {id}})
          : fromRole === "cabinet"
            ? await tx.cabinet.findUnique({where: {id}})
            : await tx.member.findUnique({where: {id}});
      if (!source) throw new Error("Source user not found");

      const baseData = {
        name: source.name,
        email: source.email,
        password: source.password,
        isVerified: source.isVerified,
        verifiedByTechHeadId: source.isVerified ? source.verifiedByTechHeadId : null,
      };

      let newId: string;
      if (toRole === "president") {
        const destination = await tx.president.upsert({
          where: {email: source.email},
          create: baseData,
          update: baseData,
        });
        newId = destination.id;
      } else if (toRole === "cabinet") {
        const destination = await tx.cabinet.upsert({
          where: {email: source.email},
          create: {...baseData, position: options.position!.trim()},
          update: {...baseData, position: options.position!.trim()},
        });
        newId = destination.id;
      } else {
        const destination = await tx.member.upsert({
          where: {email: source.email},
          create: baseData,
          update: baseData,
        });
        newId = destination.id;
      }

      // Each participant reference, including both SparRecord slots, is
      // rewritten as one old-column-null/new-column-value UPDATE.
      await migrateParticipantReferences(tx, fromRole, toRole, id, newId);

      // Delete the original role record only after every dependent reference,
      // including check-constrained SparRecord rows, has been validated.
    if (fromRole === "president") {
      await tx.president.delete({ where: { id } });
    } else if (fromRole === "cabinet") {
      await tx.cabinet.delete({ where: { id } });
    } else {
      await tx.member.delete({ where: { id } });
    }

      return {newId};
    },
    { timeout: 30000, maxWait: 10000 },
  );

  return {
    message: `User moved from ${fromRole} to ${toRole} successfully`,
    fromRole,
    toRole,
    newId: result.newId,
  };
}

async function getUnverifiedUsersImpl() {
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

async function getVerifiedUsersImpl() {
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

// Roster read lists for the TechHead dashboard. Cached under the `roster` tag,
// which every roster mutation (verify/unverify/delete/role-change/register)
// already invalidates.
export const getUnverifiedUsers: typeof getUnverifiedUsersImpl = () =>
  getOrLoad(cacheKeys.unverifiedUsers(), { tags: [CACHE_TAGS.roster] }, getUnverifiedUsersImpl);

export const getVerifiedUsers: typeof getVerifiedUsersImpl = () =>
  getOrLoad(cacheKeys.verifiedUsers(), { tags: [CACHE_TAGS.roster] }, getVerifiedUsersImpl);
