import type { PrismaClient } from "@prisma/client";

import { prisma } from "../prisma.ts";

type EvalRepositoryClient = PrismaClient;

export function createEvalRepository(client: EvalRepositoryClient = prisma) {
  async function getHistoricalReplayDataset(sessionIds: string[]) {
    return client.debateSession.findMany({
      where: {
        id: { in: sessionIds },
      },
      select: {
        id: true,
        sessionDate: true,
        motionType: true,
        motiontype: true,
        motionText: true,
        pairingObjective: true,
        publishedProposalId: true,
        attendance: {
          select: {
            memberId: true,
            cabinetId: true,
            presidentId: true,
            isPresent: true,
            wasAssigned: true,
            wasUnassigned: true,
          },
        },
      },
      orderBy: { sessionDate: "asc" },
    });
  }

  async function getStoredBaselineProposalSummaries(sessionIds: string[]) {
    return client.pairingProposal.findMany({
      where: {
        sessionId: { in: sessionIds },
        isPublishedOfficially: true,
      },
      select: {
        id: true,
        sessionId: true,
        proposalVersion: true,
        proposalScore: true,
        engineVersion: true,
        ruleVersion: true,
        publishedAt: true,
      },
      orderBy: [{ sessionId: "asc" }, { proposalVersion: "desc" }],
    });
  }

  return {
    getHistoricalReplayDataset,
    getStoredBaselineProposalSummaries,
  };
}

export const evalRepository = createEvalRepository();