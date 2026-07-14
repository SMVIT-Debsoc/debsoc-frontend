import type { DebsocRole } from "../roles.ts";
import type { SparHistoryQuery, SparHistoryResponse, SparLeaderboardResponse, SparTeammateInput, SubmitSparRequest } from "../../../types/spar.ts";
import { sparRepository, type DeletedSparInfo } from "../repositories/spar-repository.ts";
import { buildSparLeaderboard } from "./spar-leaderboard.ts";
import { teamRankToResultPoints } from "../validations/spar-validation.ts";
import { invalidateTags } from "../cache/cache.ts";
import { CACHE_TAGS } from "../cache/keys.ts";
import {
  updateLearnedMetricsForParticipant,
  updateLearnedMetricsFromSpar,
  updatePairMetricForParticipants,
  updatePairMetricFromSpar,
} from "../scoring/metric-update-service.ts";

type ParticipantType = "member" | "cabinet" | "president";

interface SparServiceUser {
  id: string;
  role: DebsocRole;
}

interface SparRepositoryContract {
  createSpar(input: Parameters<typeof sparRepository.createSpar>[0]): ReturnType<typeof sparRepository.createSpar>;
  getSparsByUser(participantId: string, participantType: ParticipantType, query: SparHistoryQuery): Promise<SparHistoryResponse>;
  checkDuplicate(input: Parameters<typeof sparRepository.checkDuplicate>[0]): Promise<boolean>;
  deleteSpar(input: Parameters<typeof sparRepository.deleteSpar>[0]): Promise<DeletedSparInfo | null>;
  participantExists(participantId: string, participantType: ParticipantType): Promise<boolean>;
  getSparAggregates(): ReturnType<typeof sparRepository.getSparAggregates>;
  getSparParticipantRoster(): ReturnType<typeof sparRepository.getSparParticipantRoster>;
}

interface SparMetricHooks {
  updateLearnedMetricsForParticipant?(participantId: string): Promise<void>;
  updateLearnedMetricsFromSpar?(sparRecordId: string): Promise<void>;
  updatePairMetricForParticipants?(firstParticipantId: string, secondParticipantId: string): Promise<void>;
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

function normalizeTeammates(input: SubmitSparRequest): SparTeammateInput[] {
  if (input.teammates && input.teammates.length > 0) {
    return input.teammates;
  }
  if (input.teammateId && input.teammateRole) {
    return [{ id: input.teammateId, role: input.teammateRole }];
  }
  return [];
}

export function createSparService(
  repository: SparRepositoryContract = sparRepository,
  metricHooks: SparMetricHooks = {},
) {
  async function submitSpar(input: SubmitSparRequest, user: SparServiceUser) {
    const participantType = toParticipantType(user.role);
    const submitter = toParticipantRef(user.id, participantType);
    const debateFormat = input.debateFormat ?? "BP";
    const teammatesInput = input.isIronMan ? [] : normalizeTeammates(input);
    const teammateRefs = [];
    const teammateKeys = new Set<string>();

    for (const teammateInput of teammatesInput) {
      const teammateType = toTeammateType(teammateInput.role);
      if (!teammateType) {
        throw new Error("Selected teammate role is invalid.");
      }
      if (teammateInput.id === user.id) {
        throw new Error("Teammate cannot be the submitter.");
      }
      const key = `${teammateInput.role}:${teammateInput.id}`;
      if (teammateKeys.has(key)) {
        throw new Error("Teammates cannot be duplicated.");
      }
      teammateKeys.add(key);

      const teammateExists = await repository.participantExists(teammateInput.id, teammateType);
      if (!teammateExists) {
        throw new Error("Selected teammate does not exist or is not verified.");
      }
      teammateRefs.push(toParticipantRef(teammateInput.id, teammateType));
    }

    if (debateFormat === "BP" && !input.isIronMan && teammateRefs.length !== 1) {
      throw new Error("Normal BP spars require exactly one teammate.");
    }
    if (debateFormat === "AP" && teammateRefs.length > 2) {
      throw new Error("AP spars can include at most two teammates.");
    }

    const primaryTeammate = teammateRefs[0] ?? null;
    const duplicateExists = await repository.checkDuplicate({
      sparDate: new Date(input.sparDate),
      debateFormat,
      bpPosition: debateFormat === "BP" ? input.bpPosition ?? null : null,
      apSide: debateFormat === "AP" ? input.apSide ?? null : null,
      submitter,
      teammate: primaryTeammate,
    });
    if (duplicateExists) {
      throw new Error("Duplicate spar submission for this date and format.");
    }

    const created = await repository.createSpar({
      sparDate: new Date(input.sparDate),
      motionType: input.motionType,
      motionText: input.motionText ?? null,
      debateFormat,
      bpPosition: debateFormat === "BP" ? input.bpPosition ?? null : null,
      apSide: debateFormat === "AP" ? input.apSide ?? null : null,
      isIronMan: input.isIronMan,
      teamRank: input.teamRank,
      teamResultPoints: teamRankToResultPoints(input.teamRank, debateFormat),
      submitter,
      teammate: primaryTeammate,
      teammates: teammateRefs,
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

  async function getSparParticipants() {
    return repository.getSparParticipantRoster();
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

    await metricHooks.updateLearnedMetricsForParticipant?.(deleted.participantId);
    for (const teammateId of deleted.teammateIds) {
      await metricHooks.updatePairMetricForParticipants?.(deleted.participantId, teammateId);
    }
    await invalidateTags([CACHE_TAGS.leaderboard, CACHE_TAGS.progress]);
    return { deleted: true };
  }

  return { submitSpar, getSparHistory, getSparParticipants, getSparLeaderboard, deleteSpar };
}

const service = createSparService(sparRepository, {
  updateLearnedMetricsForParticipant,
  updateLearnedMetricsFromSpar,
  updatePairMetricForParticipants,
  updatePairMetricFromSpar,
});

export const submitSpar = service.submitSpar;
export const getSparHistory = service.getSparHistory;
export const getSparParticipants = service.getSparParticipants;
export const getSparLeaderboard = service.getSparLeaderboard;
export const deleteSpar = service.deleteSpar;