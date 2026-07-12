import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type {
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
  bpPosition: string;
  isIronMan: boolean;
  teamRank: number;
  teamResultPoints: number;
  submitter: ParticipantRef;
  teammate: ParticipantRef | null;
  speakerScores: SparSpeakerScoreInput[];
}

export interface DeletedSparInfo {
  participantId: string;
  teammateId: string | null;
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
  bpPosition: string;
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
  bpPosition: true,
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

function toIsoDate(value: Date): string {
  return value.toISOString();
}

function toSparRecordView(record: {
  id: string;
  sparDate: Date;
  motionType: string;
  motionText: string | null;
  bpPosition: string;
  isIronMan: boolean;
  teamRank: number;
  teamResultPoints: number;
  teammateMemberId: string | null;
  teammateCabinetId: string | null;
  teammatePresidentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sparSpeakerScores: Array<{ id: string; speakingRole: string; speakerScore: number }>;
}): SparRecordView {
  const teammateId = resolveParticipantId({
    memberId: record.teammateMemberId,
    cabinetId: record.teammateCabinetId,
    presidentId: record.teammatePresidentId,
  }) || null;
  const teammateRole = record.teammateMemberId
    ? "Member"
    : record.teammateCabinetId
      ? "cabinet"
      : record.teammatePresidentId
        ? "President"
        : null;

  return {
    id: record.id,
    sparDate: toIsoDate(record.sparDate),
    motionType: record.motionType,
    motionText: record.motionText,
    bpPosition: record.bpPosition as SparRecordView["bpPosition"],
    isIronMan: record.isIronMan,
    teamRank: record.teamRank,
    teamResultPoints: record.teamResultPoints,
    teammateId,
    teammateRole,
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
        bpPosition: input.bpPosition,
        isIronMan: input.isIronMan,
        teamRank: input.teamRank,
        teamResultPoints: input.teamResultPoints,
        ...input.submitter,
        ...teammateColumns(input.teammate),
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
        bpPosition: input.bpPosition,
        ...participantWhere(input.submitter),
        ...teammateColumns(input.teammate),
      },
      select: { id: true },
    });
    return existing !== null;
  }

  async function deleteSpar(input: SparOwnershipInput): Promise<DeletedSparInfo | null> {
    const existing = await client.sparRecord.findUnique({
      where: { id: input.sparId },
      select: { id: true, isIronMan: true, ...participantSelect, teammateMemberId: true, teammateCabinetId: true, teammatePresidentId: true },
    });
    if (!existing) {
      return null;
    }

    const ownerId = resolveParticipantId(existing);
    if (!input.canModerate && ownerId !== input.participantId) {
      return null;
    }

    const teammateId = resolveParticipantId({
      memberId: existing.teammateMemberId,
      cabinetId: existing.teammateCabinetId,
      presidentId: existing.teammatePresidentId,
    }) || null;

    await client.sparRecord.delete({ where: { id: input.sparId } });
    return { participantId: ownerId, teammateId, isIronMan: existing.isIronMan };
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