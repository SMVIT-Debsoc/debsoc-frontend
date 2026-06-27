import type {
  MemberMetricSnapshot,
  PairMetricSnapshot,
  PairingGenerationContext,
  PairingProposalView,
  ParticipantKind,
} from "../../../types/pairing.ts";
import { metricsRepository } from "../repositories/metrics-repository.ts";
import { pairingRepository } from "../repositories/pairing-repository.ts";
import { generateCandidateProposals } from "./candidate-generator.ts";
import { isCandidateValid, validateHardRules } from "./hard-rules.ts";
import { loadPairingMetrics, loadSessionInputs } from "./metrics-loader.ts";
import { selectProposalFromTopBand } from "./proposal-selector.ts";
import { scoreProposal } from "./proposal-scorer.ts";
import type {
  GeneratePairingProposalInput,
  PairingCandidate,
  PairingGenerationFailure,
  PairingProposalResult,
  PersistGeneratedProposalInput,
  PreparedScoringContext,
  ScoredPairingCandidate,
} from "./types.ts";

const ENGINE_VERSION = "pairing-engine-v1";
const RULE_VERSION = "pairing-rules-v1";

interface MetricsRepositoryContract {
  getMemberMetricSnapshots(memberIds: string[]): Promise<MemberMetricSnapshot[]>;
  getPairMetricSnapshots(pairKeys: string[]): Promise<PairMetricSnapshot[]>;
}

interface PairingRepositoryContract {
  getGenerationContext(sessionId: string): Promise<PairingGenerationContext>;
  saveGeneratedProposal(input: PersistGeneratedProposalInput): Promise<PairingProposalView>;
}

interface MetricsLoaderContract {
  loadPairingMetrics(sessionId: string): Promise<{
    version: string;
    definitions: Array<{
      key: string;
      baseWeight: number;
      isEnabled: boolean;
      isSoftRule: boolean;
    }>;
    adjustmentsByMetricKey: Map<string, number>;
  }>;
  loadSessionInputs(sessionId: string): Promise<{
    objective: PreparedScoringContext["session"]["pairingObjective"];
    rules: PreparedScoringContext["rules"];
  }>;
}

interface PairingEngineDependencies {
  generateCandidateProposals: (context: PairingGenerationContext) => PairingCandidate[];
  isCandidateValid: (candidate: PairingCandidate, context: PairingGenerationContext) => boolean;
  validateHardRules: (candidate: PairingCandidate, context: PairingGenerationContext) => { isValid: boolean; violations: Array<{ code: string; message: string }> };
  scoreProposal: (candidate: PairingCandidate, context: PreparedScoringContext) => ScoredPairingCandidate;
  selectProposalFromTopBand: typeof selectProposalFromTopBand;
}

function buildMemberMetricMaps(snapshots: MemberMetricSnapshot[]) {
  const snapshotsByParticipantId = new Map<string, Map<string, MemberMetricSnapshot>>();

  for (const snapshot of snapshots) {
    if (!snapshotsByParticipantId.has(snapshot.participantId)) {
      snapshotsByParticipantId.set(snapshot.participantId, new Map());
    }

    snapshotsByParticipantId
      .get(snapshot.participantId)!
      .set(`${snapshot.metricKey}:${snapshot.contextKey ?? ""}`, snapshot);
  }

  return snapshotsByParticipantId;
}

function buildPairMetricMaps(snapshots: PairMetricSnapshot[]) {
  const snapshotsByPairKey = new Map<string, Map<string, PairMetricSnapshot>>();

  for (const snapshot of snapshots) {
    if (!snapshotsByPairKey.has(snapshot.pairKey)) {
      snapshotsByPairKey.set(snapshot.pairKey, new Map());
    }

    snapshotsByPairKey
      .get(snapshot.pairKey)!
      .set(`${snapshot.metricKey}:${snapshot.contextKey ?? ""}`, snapshot);
  }

  return snapshotsByPairKey;
}

function buildMetricWeights(
  definitions: Array<{ key: string; baseWeight: number; isEnabled: boolean; isSoftRule: boolean }>,
  adjustmentsByMetricKey: Map<string, number>,
) {
  const weights = new Map<string, number>();

  for (const definition of definitions) {
    if (!definition.isEnabled || !definition.isSoftRule) {
      continue;
    }

    weights.set(definition.key, definition.baseWeight + (adjustmentsByMetricKey.get(definition.key) ?? 0));
  }

  weights.set("team_quality_aggregate", 0.12);
  weights.set("experience_distribution_aggregate", 0.08);

  return weights;
}

function buildParticipantKindsById(context: PreparedScoringContext): Map<string, ParticipantKind> {
  return new Map(context.participants.map((participant) => [participant.participantId, participant.participantKind]));
}

function createFailure(
  reason: PairingGenerationFailure["reason"],
  detail: string,
  violations: PairingGenerationFailure["violations"] = [],
): PairingGenerationFailure {
  return {
    ok: false,
    reason,
    detail,
    violations,
  };
}

function generateSeed(seed: number | undefined): number {
  if (typeof seed === "number") {
    return seed;
  }

  return Number(String(Date.now()).slice(-9));
}

export function createPairingEngine(
  repository: PairingRepositoryContract = pairingRepository,
  metricRepository: MetricsRepositoryContract = metricsRepository,
  metricsLoader: MetricsLoaderContract = { loadPairingMetrics, loadSessionInputs },
  dependencies: PairingEngineDependencies = {
    generateCandidateProposals,
    isCandidateValid,
    validateHardRules,
    scoreProposal,
    selectProposalFromTopBand,
  },
) {
  async function generatePairingProposal(input: GeneratePairingProposalInput): Promise<PairingProposalResult> {
    const baseContext = await repository.getGenerationContext(input.sessionId).catch(() => null);
    if (!baseContext) {
      return createFailure("SESSION_NOT_FOUND", `Session ${input.sessionId} not found.`);
    }

    const speakers = baseContext.participants.filter((participant) => participant.sessionRole === "speaker");
    const adjudicators = baseContext.participants.filter((participant) => participant.sessionRole === "adjudicator");
    const roomCount = Math.floor(speakers.length / 8);

    if (roomCount === 0) {
      return createFailure(
        "INSUFFICIENT_SPEAKERS",
        "At least 8 speakers are required to generate one full BP room.",
      );
    }

    if (adjudicators.length < roomCount) {
      return createFailure(
        "INSUFFICIENT_ADJUDICATORS",
        `Need at least ${roomCount} adjudicators to cover ${roomCount} room(s).`,
      );
    }

    const [pairingMetrics, sessionInputs, memberMetricSnapshots, pairMetricSnapshots] = await Promise.all([
      metricsLoader.loadPairingMetrics(input.sessionId),
      metricsLoader.loadSessionInputs(input.sessionId),
      metricRepository.getMemberMetricSnapshots(baseContext.participants.map((participant) => participant.participantId)),
      metricRepository.getPairMetricSnapshots([...baseContext.pairMetricsByKey.keys()]),
    ]);

    const scoringContext: PreparedScoringContext = {
      ...baseContext,
      session: {
        ...baseContext.session,
        pairingObjective: sessionInputs.objective,
      },
      rules: sessionInputs.rules,
      memberMetricSnapshotsByParticipantId: buildMemberMetricMaps(memberMetricSnapshots),
      pairMetricSnapshotsByPairKey: buildPairMetricMaps(pairMetricSnapshots),
      metricWeightsByKey: buildMetricWeights(pairingMetrics.definitions, pairingMetrics.adjustmentsByMetricKey),
      metricSnapshotVersion: pairingMetrics.version,
    };

    const generatedCandidates = dependencies.generateCandidateProposals(scoringContext);
    if (generatedCandidates.length === 0) {
      return createFailure("NO_CANDIDATES_GENERATED", "The engine could not build any complete candidate proposal.");
    }

    const validCandidates = generatedCandidates.filter((candidate) => dependencies.isCandidateValid(candidate, scoringContext));
    if (validCandidates.length === 0) {
      const violations = generatedCandidates.flatMap((candidate) => dependencies.validateHardRules(candidate, scoringContext).violations);
      return createFailure("NO_VALID_PROPOSAL", "All generated candidates violated hard rules.", violations);
    }

    const scoredCandidates = validCandidates
      .map((candidate) => dependencies.scoreProposal(candidate, scoringContext))
      .sort((left, right) => right.proposalScore - left.proposalScore);

    const selection = dependencies.selectProposalFromTopBand(scoredCandidates, { seed: generateSeed(input.seed) });
    const audit = {
      ...selection.audit,
      engineVersion: ENGINE_VERSION,
      ruleVersion: RULE_VERSION,
      metricSnapshotVersion: scoringContext.metricSnapshotVersion,
      objective: scoringContext.session.pairingObjective,
    };

    const proposal = await repository.saveGeneratedProposal({
      sessionId: input.sessionId,
      generatedBy: input.generatedBy ?? null,
      candidate: selection.candidate,
      participantKindsById: buildParticipantKindsById(scoringContext),
      audit,
    });

    return {
      ok: true,
      proposal,
      audit,
    };
  }

  return {
    generatePairingProposal,
  };
}

export const { generatePairingProposal } = createPairingEngine();
