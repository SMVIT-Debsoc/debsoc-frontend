import type { DebsocRole } from "../roles.ts";
import type { SparHistoryQuery, SparHistoryResponse, SparLeaderboardResponse, SubmitSparRequest } from "../../../types/spar.ts";
import { sparRepository } from "../repositories/spar-repository.ts";
import { buildSparLeaderboard } from "./spar-leaderboard.ts";
import { teamRankToResultPoints } from "../validations/spar-validation.ts";
import { invalidateTags } from "../cache/cache.ts";
import { CACHE_TAGS } from "../cache/keys.ts";

type ParticipantType = "member" | "cabinet" | "president";

interface SparServiceUser {
  id: string;
  role: DebsocRole;
}

interface SparRepositoryContract {
  createSpar(input: Parameters<typeof sparRepository.createSpar>[0]): ReturnType<typeof sparRepository.createSpar>;
  getSparsByUser(participantId: string, participantType: ParticipantType, query: SparHistoryQuery): Promise<SparHistoryResponse>;
  checkDuplicate(input: Parameters<typeof sparRepository.checkDuplicate>[0]): Promise<boolean>;
  deleteSpar(input: Parameters<typeof sparRepository.deleteSpar>[0]): Promise<boolean>;
  participantExists(participantId: string, participantType: ParticipantType): Promise<boolean>;
  getSparAggregates(): ReturnType<typeof sparRepository.getSparAggregates>;
}

interface SparMetricHooks {
  updateLearnedMetricsFromSpar?(sparRecordId: string): Promise<void>;
  updatePairMetricFromSpar?(sparRecordId: string): Promise<void>;
}

function toParticipantType(role: DebsocRole): ParticipantType {
  if (role === "Member") return "member";
  if (role === "cabinet") return "cabinet";
  if (role === "President") return "president";
  throw new Error("TechHead cannot submit spars.");
}

function toParticipantRef(participantId: string, participantType: ParticipantType) {
  return {
    memberId: participantType === "member" ? participantId : null,
    cabinetId: participantType === "cabinet" ? participantId : null,
    presidentId: participantType === "president" ? participantId : null,
  };
}

function toTeammateType(role: SubmitSparRequest["teammateRole"]): ParticipantType | null {
  if (role === "Member") return "member";
  if (role === "cabinet") return "cabinet";
  if (role === "President") return "president";
  return null;
}

export function createSparService(
  repository: SparRepositoryContract = sparRepository,
  metricHooks: SparMetricHooks = {},
) {
  async function submitSpar(input: SubmitSparRequest, user: SparServiceUser) {
    const participantType = toParticipantType(user.role);
    const submitter = toParticipantRef(user.id, participantType);
    const teammateType = toTeammateType(input.teammateRole ?? null);
    const teammate = input.isIronMan || !input.teammateId || !teammateType
      ? null
      : toParticipantRef(input.teammateId, teammateType);

    if (input.teammateId === user.id) {
      throw new Error("Teammate cannot be the submitter.");
    }

    if (!input.isIronMan) {
      if (!input.teammateId || !teammateType || !teammate) {
        throw new Error("Normal spars require a valid teammate.");
      }
      const teammateExists = await repository.participantExists(input.teammateId, teammateType);
      if (!teammateExists) {
        throw new Error("Selected teammate does not exist or is not verified.");
      }
    }

    const duplicateExists = await repository.checkDuplicate({
      sparDate: new Date(input.sparDate),
      bpPosition: input.bpPosition,
      submitter,
      teammate,
    });
    if (duplicateExists) {
      throw new Error("Duplicate spar submission for this date, position, and teammate.");
    }

    const created = await repository.createSpar({
      sparDate: new Date(input.sparDate),
      motionType: input.motionType,
      motionText: input.motionText ?? null,
      bpPosition: input.bpPosition,
      isIronMan: input.isIronMan,
      teamRank: input.teamRank,
      teamResultPoints: teamRankToResultPoints(input.teamRank),
      submitter,
      teammate,
      speakerScores: input.speakerScores,
    });

    await metricHooks.updateLearnedMetricsFromSpar?.(created.id);
    if (!input.isIronMan) {
      await metricHooks.updatePairMetricFromSpar?.(created.id);
    }
    await invalidateTags([CACHE_TAGS.leaderboard, CACHE_TAGS.progress]);

    return created;
  }

  async function getSparHistory(user: SparServiceUser, query: SparHistoryQuery): Promise<SparHistoryResponse> {
    return repository.getSparsByUser(user.id, toParticipantType(user.role), query);
  }

  async function getSparLeaderboard(user: SparServiceUser, page: number, limit: number): Promise<SparLeaderboardResponse> {
    const rows = await repository.getSparAggregates();
    return buildSparLeaderboard(rows, user.id, page, limit);
  }

  async function deleteSpar(sparId: string, user: SparServiceUser): Promise<{ deleted: boolean }> {
    const deleted = await repository.deleteSpar({
      sparId,
      participantId: user.id,
      participantType: toParticipantType(user.role),
      canModerate: user.role === "cabinet" || user.role === "President",
    });
    if (!deleted) {
      throw new Error("Spar record not found or not allowed.");
    }
    await invalidateTags([CACHE_TAGS.leaderboard, CACHE_TAGS.progress]);
    return { deleted };
  }

  return { submitSpar, getSparHistory, getSparLeaderboard, deleteSpar };
}

const service = createSparService();

export const submitSpar = service.submitSpar;
export const getSparHistory = service.getSparHistory;
export const getSparLeaderboard = service.getSparLeaderboard;
export const deleteSpar = service.deleteSpar;