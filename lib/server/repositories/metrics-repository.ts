import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";
import type {
  MemberId,
  MemberMetricSnapshot,
  PairKey,
  PairMetricSnapshot,
} from "../../../types/pairing.ts";

type MetricsRepositoryClient = PrismaClient;

interface ParticipantRef {
  memberId: string | null;
  cabinetId: string | null;
  presidentId: string | null;
}

const PARTICIPANT_REF_SEPARATOR = "::";

function resolveParticipantId(ref: ParticipantRef): MemberId {
  return ref.memberId ?? ref.cabinetId ?? ref.presidentId ?? "";
}

function buildPairKeyFromIds(firstParticipantId: MemberId, secondParticipantId: MemberId): PairKey {
  return [firstParticipantId, secondParticipantId].sort().join(PARTICIPANT_REF_SEPARATOR);
}

function buildPairKeyFromRefs(
  firstRef: ParticipantRef,
  secondRef: ParticipantRef,
): PairKey {
  return buildPairKeyFromIds(resolveParticipantId(firstRef), resolveParticipantId(secondRef));
}

function extractParticipantIdsFromPairKeys(pairKeys: PairKey[]): MemberId[] {
  return [...new Set(pairKeys.flatMap((pairKey) => pairKey.split(PARTICIPANT_REF_SEPARATOR).filter(Boolean)))];
}

export function createMetricsRepository(client: MetricsRepositoryClient = prisma) {
  async function getMemberMetricSnapshots(memberIds: MemberId[]): Promise<MemberMetricSnapshot[]> {
    if (memberIds.length === 0) {
      return [];
    }

    const rows: Array<{
      memberId: string | null;
      cabinetId: string | null;
      presidentId: string | null;
      metricKey: string;
      contextKey: string | null;
      value: number;
      observationCount: number;
      confidence: number;
    }> = await client.memberMetricSnapshot.findMany({
      where: {
        OR: [
          { memberId: { in: memberIds } },
          { cabinetId: { in: memberIds } },
          { presidentId: { in: memberIds } },
        ],
      },
      select: {
        memberId: true,
        cabinetId: true,
        presidentId: true,
        metricKey: true,
        contextKey: true,
        value: true,
        observationCount: true,
        confidence: true,
      },
    });

    return rows
      .map((row: (typeof rows)[number]) => {
        const participantId = resolveParticipantId(row);
        if (!participantId) {
          return null;
        }

        return {
          participantId,
          metricKey: row.metricKey,
          contextKey: row.contextKey,
          value: row.value,
          observationCount: row.observationCount,
          confidence: row.confidence,
        } satisfies MemberMetricSnapshot;
      })
      .filter((snapshot: MemberMetricSnapshot | null): snapshot is MemberMetricSnapshot => snapshot !== null);
  }

  async function getPairMetricSnapshots(pairKeys: PairKey[]): Promise<PairMetricSnapshot[]> {
    if (pairKeys.length === 0) {
      return [];
    }

    const participantIds = extractParticipantIdsFromPairKeys(pairKeys);
    if (participantIds.length === 0) {
      return [];
    }

    const rows: Array<{
      memberAId: string | null;
      cabinetAId: string | null;
      presidentAId: string | null;
      memberBId: string | null;
      cabinetBId: string | null;
      presidentBId: string | null;
      metricKey: string;
      contextKey: string | null;
      value: number;
      observationCount: number;
      confidence: number;
    }> = await client.pairMetricSnapshot.findMany({
      where: {
        OR: [
          { memberAId: { in: participantIds } },
          { cabinetAId: { in: participantIds } },
          { presidentAId: { in: participantIds } },
          { memberBId: { in: participantIds } },
          { cabinetBId: { in: participantIds } },
          { presidentBId: { in: participantIds } },
        ],
      },
      select: {
        memberAId: true,
        cabinetAId: true,
        presidentAId: true,
        memberBId: true,
        cabinetBId: true,
        presidentBId: true,
        metricKey: true,
        contextKey: true,
        value: true,
        observationCount: true,
        confidence: true,
      },
    });

    const requestedPairKeys = new Set(pairKeys);

    return rows
      .map((row: (typeof rows)[number]) => {
        const memberAId = resolveParticipantId({
          memberId: row.memberAId,
          cabinetId: row.cabinetAId,
          presidentId: row.presidentAId,
        });
        const memberBId = resolveParticipantId({
          memberId: row.memberBId,
          cabinetId: row.cabinetBId,
          presidentId: row.presidentBId,
        });

        if (!memberAId || !memberBId) {
          return null;
        }

        const pairKey = buildPairKeyFromIds(memberAId, memberBId);
        if (!requestedPairKeys.has(pairKey)) {
          return null;
        }

        return {
          pairKey,
          memberAId,
          memberBId,
          metricKey: row.metricKey,
          contextKey: row.contextKey,
          value: row.value,
          observationCount: row.observationCount,
          confidence: row.confidence,
        } satisfies PairMetricSnapshot;
      })
      .filter((snapshot: PairMetricSnapshot | null): snapshot is PairMetricSnapshot => snapshot !== null);
  }

  async function getMetricDefinitions() {
    return client.pairingMetricDefinition.findMany({
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        category: true,
        baseWeight: true,
        isEnabled: true,
        isHardRule: true,
        isSoftRule: true,
        scope: true,
        fallbackConfigJson: true,
      },
      orderBy: { key: "asc" },
    });
  }

  async function getMetricAdjustments() {
    return client.pairingMetricAdjustment.findMany({
      select: {
        id: true,
        metricDefinitionId: true,
        currentAdjustment: true,
        lastUpdatedAt: true,
        sourceWindowId: true,
      },
    });
  }

  return {
    getMemberMetricSnapshots,
    getPairMetricSnapshots,
    getMetricDefinitions,
    getMetricAdjustments,
  };
}

export const metricsRepository = createMetricsRepository();

export { buildPairKeyFromIds, buildPairKeyFromRefs, resolveParticipantId };