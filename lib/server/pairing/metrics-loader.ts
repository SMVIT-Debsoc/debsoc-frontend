import type { PairingGenerationContext } from "../../../types/pairing.ts";
import { metricsRepository } from "../repositories/metrics-repository.ts";
import { sessionRepository } from "../repositories/session-repository.ts";
import { pairingRepository } from "../repositories/pairing-repository.ts";
import type { PairingMetricContext, SessionInputContext } from "./types.ts";

interface MetricsRepositoryContract {
  getMetricDefinitions(): Promise<Array<{
    id?: string;
    key: string;
    category: string;
    baseWeight: number;
    isEnabled: boolean;
    isHardRule: boolean;
    isSoftRule: boolean;
    scope: string;
    fallbackConfigJson: unknown;
  }>>;
  getMetricAdjustments(): Promise<Array<{
    metricDefinitionId: string;
    currentAdjustment: number;
  }>>;
}

interface SessionRepositoryContract {
  getSessionById(sessionId: string): Promise<{
    pairingObjective: string;
    sessionRules: SessionInputContext["rules"] extends infer _R ? {
      timeConstraints: Array<{ participantId: string; isStrict: boolean }>;
      eventTeamUpPreferences: Array<{ firstParticipantId: string; secondParticipantId: string; isStrict: boolean }>;
    } : never;
  } | null>;
}

interface PairingRepositoryContract {
  getGenerationContext(sessionId: string): Promise<PairingGenerationContext>;
}

function buildMetricSnapshotVersion(
  definitions: Array<{ key: string; baseWeight: number; isEnabled: boolean }>,
  adjustments: Array<{ metricDefinitionId: string; currentAdjustment: number }>,
): string {
  const definitionPart = definitions
    .map((definition) => `${definition.key}:${definition.baseWeight}:${definition.isEnabled ? 1 : 0}`)
    .sort()
    .join("|");
  const adjustmentPart = adjustments
    .map((adjustment) => `${adjustment.metricDefinitionId}:${adjustment.currentAdjustment}`)
    .sort()
    .join("|");

  return `defs[${definitionPart}]::adjs[${adjustmentPart}]`;
}

export function createMetricsLoader(
  metricsRepo: MetricsRepositoryContract = metricsRepository,
  sessionRepo: SessionRepositoryContract = sessionRepository,
  pairingRepo: PairingRepositoryContract = pairingRepository,
) {
  async function loadPairingMetrics(sessionId: string): Promise<PairingMetricContext> {
    await pairingRepo.getGenerationContext(sessionId);

    const [definitions, adjustments] = await Promise.all([
      metricsRepo.getMetricDefinitions(),
      metricsRepo.getMetricAdjustments(),
    ]);

    const definitionIdsById = new Map(
      definitions
        .filter((definition): definition is typeof definition & { id: string } => typeof definition.id === "string")
        .map((definition) => [definition.id, definition.key]),
    );
    const adjustmentsByMetricKey = new Map<string, number>();

    for (const adjustment of adjustments) {
      const metricKey = definitionIdsById.get(adjustment.metricDefinitionId);
      if (metricKey) {
        adjustmentsByMetricKey.set(metricKey, adjustment.currentAdjustment);
      }
    }

    return {
      version: buildMetricSnapshotVersion(definitions, adjustments),
      definitions,
      adjustmentsByMetricKey,
    };
  }

  async function loadSessionInputs(sessionId: string): Promise<SessionInputContext> {
    const session = await sessionRepo.getSessionById(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found.`);
    }

    return {
      objective: (session.pairingObjective ?? "BALANCED") as SessionInputContext["objective"],
      rules: {
        timeConstraints: session.sessionRules.timeConstraints,
        forcedTeamUps: session.sessionRules.eventTeamUpPreferences,
        forcedSeparations: [],
        forcedChairParticipantId: null,
        forcedRoomCount: null,
      },
    };
  }

  return {
    loadPairingMetrics,
    loadSessionInputs,
  };
}

export const { loadPairingMetrics, loadSessionInputs } = createMetricsLoader();
