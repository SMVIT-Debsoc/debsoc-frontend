import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type {
  ApSide,
  SparDebateFormat,
  SparHistoryQuery,
  SparParticipantRole,
  SparRecordView,
  SparSpeakerScoreInput,
} from "../../../types/spar.ts";
import { resolveParticipantId } from "./metrics-repository.ts";

type SparRepositoryClient = PrismaClient;
type ParticipantType = "member" | "cabinet" | "president";

interface ParticipantRef {
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
}

interface SparCreateInput {
  sparDate: Date;
  motionType: string;
  motionText: string | null;
  debateFormat: SparDebateFormat;
  bpPosition: string | null;
  apSide: ApSide | null;
  isIronMan: boolean;
  teamRank: number;
  teamResultPoints: number;
  submitter: ParticipantRef;
  teammate: ParticipantRef | null;
  teammates: ParticipantRef[];
  speakerScores: SparSpeakerScoreInput[];
}

export interface DeletedSparInfo {
  participantId: string;
  teammateId: string | null;
  teammateIds: string[];
  isIronMan: boolean;
}

interface SparOwnershipInput {
  sparId: string;
  participantId: string;
  participantType: ParticipantType;
  canModerate: boolean;
}

interface SparDuplicateInput {
  sparDate: Date;
  debateFormat: SparDebateFormat;
  bpPosition: string | null;
  apSide: ApSide | null;
  submitter: ParticipantRef;
  teammate: ParticipantRef | null;
}

export interface SparAggregateRow {
  participantId: string;
  participantRole: SparParticipantRole;
  participantName: string;
  sparDates: Date[];
  spars: Array<{ sparDate: Date; isIronMan: boolean }>;
  ironManCount: number;
  totalSpars: number;
}

const participantSelect = {
  memberId: true,
  cabinetId: true,
  presidentId: true,
} as const;

const sparRecordSelect = {
  id: true,
  sparDate: true,
  motionType: true,
  motionText: true,
  debateFormat: true,
  bpPosition: true,
  apSide: true,
  isIronMan: true,
  teamRank: true,
  teamResultPoints: true,
  memberId: true,
  cabinetId: true,
  presidentId: true,
  teammateMemberId: true,
  teammateCabinetId: true,
  teammatePresidentId: true,
  createdAt: true,
  updatedAt: true,
  sparTeammates: {
    select: {
      id: true,
      memberId: true,
      cabinetId: true,
      presidentId: true,
    },
    orderBy: { createdAt: "asc" },
  },
  sparSpeakerScores: {
    select: {
      id: true,
      speakingRole: true,
      speakerScore: true,
    },
    orderBy: { speakingRole: "asc" },
  },
} as const;

function participantRefForType(participantId: string, participantType: ParticipantType): ParticipantRef {
  return {
    memberId: participantType === "member" ? participantId : null,
    cabinetId: participantType === "cabinet" ? participantId : null,
    presidentId: participantType === "president" ? participantId : null,
  };
}

function teammateColumns(teammate: ParticipantRef | null) {
  return {
    teammateMemberId: teammate?.memberId ?? null,
    teammateCabinetId: teammate?.cabinetId ?? null,
    teammatePresidentId: teammate?.presidentId ?? null,
  };
}

function participantWhere(ref: ParticipantRef) {
  return {
    memberId: ref.memberId,
    cabinetId: ref.cabinetId,
    presidentId: ref.presidentId,
  };
}

function participantRoleFromRef(ref: ParticipantRef): SparParticipantRole | null {
  if (ref.memberId) return "Member";
  if (ref.cabinetId) return "cabinet";
  if (ref.presidentId) return "President";
  return null;
}

function toIsoDate(value: Date): string {
  return value.toISOString();
}

function toSparRecordView(record: {
  id: string;
  sparDate: Date;
  motionType: string;
  motionText: string | null;
  debateFormat: string;
  bpPosition: string | null;
  apSide: string | null;
  isIronMan: boolean;
  teamRank: number;
  teamResultPoints: number;
  teammateMemberId: string | null;
  teammateCabinetId: string | null;
  teammatePresidentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sparTeammates?: Array<{ id: string; memberId: string | null; cabinetId: string | null; presidentId: string | null }>;
  sparSpeakerScores: Array<{ id: string; speakingRole: string; speakerScore: number }>;
}): SparRecordView {
  const legacyTeammateRef = {
    memberId: record.teammateMemberId,
    cabinetId: record.teammateCabinetId,
    presidentId: record.teammatePresidentId,
  };
  const teammateId = resolveParticipantId(legacyTeammateRef) || null;
  const teammateRole = participantRoleFromRef(legacyTeammateRef);
  const teammates = (record.sparTeammates ?? [])
    .map((teammate) => {
      const participantId = resolveParticipantId(teammate);
      const participantRole = participantRoleFromRef(teammate);
      return participantId && participantRole
        ? { id: teammate.id, participantId, participantRole }
        : null;
    })
    .filter((teammate): teammate is NonNullable<typeof teammate> => teammate !== null);

  return {
    id: record.id,
    sparDate: toIsoDate(record.sparDate),
    motionType: record.motionType,
    motionText: record.motionText,
    debateFormat: (record.debateFormat || "BP") as SparRecordView["debateFormat"],
    bpPosition: record.bpPosition as SparRecordView["bpPosition"],
    apSide: record.apSide as SparRecordView["apSide"],
    isIronMan: record.isIronMan,
    teamRank: record.teamRank,
    teamResultPoints: record.teamResultPoints,
    teammateId: teammateId ?? teammates[0]?.participantId ?? null,
    teammateRole: teammateRole ?? teammates[0]?.participantRole ?? null,
    teammates,
    speakerScores: record.sparSpeakerScores.map((score) => ({
      id: score.id,
      speakingRole: score.speakingRole as SparRecordView["speakerScores"][number]["speakingRole"],
      speakerScore: score.speakerScore,
    })),
    createdAt: toIsoDate(record.createdAt),
    updatedAt: toIsoDate(record.updatedAt),
  };
}

export function createSparRepository(client: SparRepositoryClient = prisma) {
  async function createSpar(input: SparCreateInput): Promise<SparRecordView> {
    const created = await client.sparRecord.create({
      data: {
        sparDate: input.sparDate,
        motionType: input.motionType,
        motionText: input.motionText,
        debateFormat: input.debateFormat,
        bpPosition: input.bpPosition,
        apSide: input.apSide,
        isIronMan: input.isIronMan,
        teamRank: input.teamRank,
        teamResultPoints: input.teamResultPoints,
        ...input.submitter,
        ...teammateColumns(input.teammate),
        sparTeammates: input.teammates.length > 0
          ? {
              create: input.teammates.map((teammate) => ({ ...teammate })),
            }
          : undefined,
        sparSpeakerScores: {
          create: input.speakerScores.map((score) => ({
            speakingRole: score.speakingRole,
            speakerScore: score.speakerScore,
          })),
        },
      },
      select: sparRecordSelect,
    });

    return toSparRecordView(created);
  }

  async function getSparsByUser(participantId: string, participantType: ParticipantType, query: SparHistoryQuery) {
    const where = participantRefForType(participantId, participantType);
    const skip = (query.page - 1) * query.limit;
    const [records, totalRecords] = await Promise.all([
      client.sparRecord.findMany({
        where,
        select: sparRecordSelect,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit,
      }),
      client.sparRecord.count({ where }),
    ]);

    return {
      records: records.map(toSparRecordView),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(totalRecords / query.limit),
        totalRecords,
      },
    };
  }

  async function checkDuplicate(input: SparDuplicateInput): Promise<boolean> {
    const existing = await client.sparRecord.findFirst({
      where: {
        sparDate: input.sparDate,
        debateFormat: input.debateFormat,
        bpPosition: input.bpPosition,
        apSide: input.apSide,
        ...participantWhere(input.submitter),
        ...(input.debateFormat === "BP" ? teammateColumns(input.teammate) : {}),
      },
      select: { id: true },
    });
    return existing !== null;
  }

  async function deleteSpar(input: SparOwnershipInput): Promise<DeletedSparInfo | null> {
    const existing = await client.sparRecord.findUnique({
      where: { id: input.sparId },
      select: {
        id: true,
        isIronMan: true,
        ...participantSelect,
        teammateMemberId: true,
        teammateCabinetId: true,
        teammatePresidentId: true,
        sparTeammates: { select: { memberId: true, cabinetId: true, presidentId: true } },
      },
    });
    if (!existing) {
      return null;
    }

    const ownerId = resolveParticipantId(existing);
    if (!ownerId || (!input.canModerate && ownerId !== input.participantId)) {
      return null;
    }

    const legacyTeammateId = resolveParticipantId({
      memberId: existing.teammateMemberId,
      cabinetId: existing.teammateCabinetId,
      presidentId: existing.teammatePresidentId,
    }) || null;
    const teammateIds = [
      legacyTeammateId,
      ...existing.sparTeammates.map((teammate: { memberId: string | null; cabinetId: string | null; presidentId: string | null }) => resolveParticipantId(teammate) || null),
    ].filter((id): id is string => id !== null);

    await client.sparRecord.delete({ where: { id: input.sparId } });
    return { participantId: ownerId, teammateId: legacyTeammateId ?? teammateIds[0] ?? null, teammateIds, isIronMan: existing.isIronMan };
  }

  async function participantExists(participantId: string, participantType: ParticipantType): Promise<boolean> {
    if (participantType === "member") {
      return (await client.member.count({ where: { id: participantId, isVerified: true } })) > 0;
    }
    if (participantType === "cabinet") {
      return (await client.cabinet.count({ where: { id: participantId, isVerified: true } })) > 0;
    }
    return (await client.president.count({ where: { id: participantId, isVerified: true } })) > 0;
  }

  async function getSparParticipantRoster() {
    const [members, cabinet, presidents] = await Promise.all([
      client.member.findMany({
        where: { isVerified: true },
        select: { id: true, name: true, email: true, isVerified: true },
        orderBy: { name: "asc" },
      }),
      client.cabinet.findMany({
        where: { isVerified: true },
        select: { id: true, name: true, email: true, position: true, isVerified: true },
        orderBy: { name: "asc" },
      }),
      client.president.findMany({
        where: { isVerified: true },
        select: { id: true, name: true, email: true, isVerified: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return { members, cabinet, presidents };
  }

  async function getSparAggregates(): Promise<SparAggregateRow[]> {
    const records = await client.sparRecord.findMany({
      select: {
        sparDate: true,
        isIronMan: true,
        memberId: true,
        cabinetId: true,
        presidentId: true,
        member: { select: { name: true } },
        cabinet: { select: { name: true } },
        president: { select: { name: true } },
      },
      orderBy: { sparDate: "asc" },
    });

    const aggregates = new Map<string, SparAggregateRow>();
    for (const record of records) {
      const participantId = resolveParticipantId(record);
      if (!participantId) continue;

      const participantRole = record.memberId ? "Member" : record.cabinetId ? "cabinet" : "President";
      const participantName = record.member?.name ?? record.cabinet?.name ?? record.president?.name ?? "Unknown";
      const key = `${participantRole}:${participantId}`;
      const current: SparAggregateRow = aggregates.get(key) ?? {
        participantId,
        participantRole,
        participantName,
        sparDates: [],
        spars: [],
        ironManCount: 0,
        totalSpars: 0,
      };

      current.sparDates.push(record.sparDate);
      current.spars.push({ sparDate: record.sparDate, isIronMan: record.isIronMan });
      current.totalSpars += 1;
      if (record.isIronMan) {
        current.ironManCount += 1;
      }
      aggregates.set(key, current);
    }

    return [...aggregates.values()];
  }

  return {
    createSpar,
    getSparsByUser,
    checkDuplicate,
    deleteSpar,
    participantExists,
    getSparParticipantRoster,
    getSparAggregates,
  };
}

export const sparRepository = createSparRepository();