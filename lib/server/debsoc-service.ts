import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { authenticateRole, normalizeEmail } from "@/lib/server/auth-models";
import type { DebsocRole } from "@/lib/server/roles";
import { getOrLoad, invalidateTags } from "@/lib/server/cache/cache";
import { CACHE_TAGS, cacheKeys } from "@/lib/server/cache/keys";

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

type RoleKey = "president" | "cabinet" | "member";

const ROLE_TO_ID_COLUMN: Record<RoleKey, "presidentId" | "cabinetId" | "memberId"> = {
  president: "presidentId",
  cabinet: "cabinetId",
  member: "memberId",
};

// Every table + column-triple that references a participant across President/cabinet/Member.
// Each entry lists the model name (as it appears on the Prisma client) and the
// role-scoped column names in that model.
const PARTICIPANT_REFERENCE_MAP: Array<{
  model:
    | "attendance"
    | "sessionRoleAssignment"
    | "teamSpeakerAssignment"
    | "roomAdjudicatorAssignment"
    | "unassignedParticipant"
    | "speakerScoreRecord"
    | "chairFeedbackRecord"
    | "adjudicatorScoreRecord"
    | "memberMetricSnapshot"
    | "pairMetricSnapshot"
    | "teamDynamicsRating"
    | "leaderboardSnapshot";
  cols: { member: string; cabinet: string; president: string };
}> = [
  { model: "attendance", cols: { member: "memberId", cabinet: "cabinetId", president: "presidentId" } },
  { model: "sessionRoleAssignment", cols: { member: "memberId", cabinet: "cabinetId", president: "presidentId" } },
  { model: "teamSpeakerAssignment", cols: { member: "memberId", cabinet: "cabinetId", president: "presidentId" } },
  { model: "roomAdjudicatorAssignment", cols: { member: "memberId", cabinet: "cabinetId", president: "presidentId" } },
  { model: "unassignedParticipant", cols: { member: "memberId", cabinet: "cabinetId", president: "presidentId" } },
  { model: "speakerScoreRecord", cols: { member: "memberId", cabinet: "cabinetId", president: "presidentId" } },
  { model: "speakerScoreRecord", cols: { member: "scoredByMemberId", cabinet: "scoredByCabinetId", president: "scoredByPresidentId" } },
  { model: "chairFeedbackRecord", cols: { member: "speakerMemberId", cabinet: "speakerCabinetId", president: "speakerPresidentId" } },
  { model: "chairFeedbackRecord", cols: { member: "chairMemberId", cabinet: "chairCabinetId", president: "chairPresidentId" } },
  { model: "adjudicatorScoreRecord", cols: { member: "chairMemberId", cabinet: "chairCabinetId", president: "chairPresidentId" } },
  { model: "adjudicatorScoreRecord", cols: { member: "adjudicatorMemberId", cabinet: "adjudicatorCabinetId", president: "adjudicatorPresidentId" } },
  { model: "memberMetricSnapshot", cols: { member: "memberId", cabinet: "cabinetId", president: "presidentId" } },
  { model: "pairMetricSnapshot", cols: { member: "memberAId", cabinet: "cabinetAId", president: "presidentAId" } },
  { model: "pairMetricSnapshot", cols: { member: "memberBId", cabinet: "cabinetBId", president: "presidentBId" } },
  { model: "teamDynamicsRating", cols: { member: "raterMemberId", cabinet: "raterCabinetId", president: "raterPresidentId" } },
  { model: "teamDynamicsRating", cols: { member: "teammateMemberId", cabinet: "teammateCabinetId", president: "teammatePresidentId" } },
  { model: "leaderboardSnapshot", cols: { member: "memberId", cabinet: "cabinetId", president: "presidentId" } },
];

async function fetchExistingRecord(role: RoleKey, id: string) {
  if (role === "president") return prisma.president.findUnique({ where: { id } });
  if (role === "cabinet") return prisma.cabinet.findUnique({ where: { id } });
  return prisma.member.findUnique({ where: { id } });
}

async function assertEmailAvailableForRole(role: RoleKey, email: string) {
  if (role === "president") {
    const existing = await prisma.president.findUnique({ where: { email } });
    if (existing) throw new Error("A president with that email already exists");
  } else if (role === "cabinet") {
    const existing = await prisma.cabinet.findUnique({ where: { email } });
    if (existing) throw new Error("A cabinet member with that email already exists");
  } else {
    const existing = await prisma.member.findUnique({ where: { email } });
    if (existing) throw new Error("A member with that email already exists");
  }
}

async function changeEntityRoleImpl(
  fromRole: RoleKey,
  toRole: RoleKey,
  id: string,
  options: { position?: string; techHeadId: string },
) {
  if (!id) throw new Error("User ID is required");
  if (fromRole === toRole) throw new Error("Source and target roles are the same");
  if (toRole === "cabinet" && !options.position?.trim()) {
    throw new Error("A cabinet position is required when promoting or demoting to cabinet");
  }

  const source = await fetchExistingRecord(fromRole, id);
  if (!source) throw new Error("Source user not found");

  await assertEmailAvailableForRole(toRole, source.email);

  const result = await prisma.$transaction(
    async (tx: any) => {
    // 1. Create the new record with the same identity/credentials and verified status.
    let newId: string;
    const baseData = {
      name: source.name,
      email: source.email,
      password: source.password,
      isVerified: source.isVerified,
      verifiedByTechHeadId: source.isVerified ? options.techHeadId : null,
    };

    if (toRole === "president") {
      const created = await tx.president.create({ data: baseData });
      newId = created.id;
    } else if (toRole === "cabinet") {
      const created = await tx.cabinet.create({
        data: { ...baseData, position: options.position!.trim() },
      });
      newId = created.id;
    } else {
      const created = await tx.member.create({ data: baseData });
      newId = created.id;
    }

    // 2. Rewrite every cross-table reference from old ID to new ID (moving column too).
    const fromCol = (m: (typeof PARTICIPANT_REFERENCE_MAP)[number]["cols"]) => m[fromRole];
    const toCol = (m: (typeof PARTICIPANT_REFERENCE_MAP)[number]["cols"]) => m[toRole];

    await Promise.all(
      PARTICIPANT_REFERENCE_MAP.map((entry) => {
        const from = fromCol(entry.cols);
        const to = toCol(entry.cols);
        return (tx as any)[entry.model].updateMany({
          where: { [from]: id },
          data: { [from]: null, [to]: newId },
        });
      }),
    );

    // 3. Delete the original role record now that nothing references it.
    if (fromRole === "president") {
      await tx.president.delete({ where: { id } });
    } else if (fromRole === "cabinet") {
      await tx.cabinet.delete({ where: { id } });
    } else {
      await tx.member.delete({ where: { id } });
    }

    return { newId };
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
