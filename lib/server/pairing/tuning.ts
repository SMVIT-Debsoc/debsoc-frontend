import { evalRepository } from "../repositories/eval-repository.ts";
import type { MetricAdjustmentSuggestion, TuningReviewResult, TuningWindowInput } from "../eval/types.ts";

interface TuningRepositoryContract {
  getTuningWindowDataset(window: TuningWindowInput): Promise<Array<{
    id: string;
    publishedProposal: {
      id: string;
      proposalScore: number;
      rating: { rating: number } | null;
      speakerScoreRecords: Array<{ teamResultPoints: number }>;
      chairFeedbackRecords: Array<{ rating: number }>;
    } | null;
  }>>;
  getMetricDefinitionsWithAdjustments(): Promise<Array<{ key: string; currentAdjustment: number }>>;
  createTuningReviewWindowRecord(input: {
    windowStartSessionId: string;
    windowEndSessionId: string;
    sessionCount: number;
    analysisJson: Record<string, unknown>;
    status: string;
  }): Promise<{ id: string }>;
  createMetricAdjustmentHistoryRecords(windowId: string, suggestions: MetricAdjustmentSuggestion[]): Promise<unknown>;
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function suggestMetricAdjustments(
  window: TuningWindowInput,
  repository: TuningRepositoryContract = evalRepository as TuningRepositoryContract,
): Promise<MetricAdjustmentSuggestion[]> {
  const [sessions, metricDefinitions] = await Promise.all([
    repository.getTuningWindowDataset(window),
    repository.getMetricDefinitionsWithAdjustments(),
  ]);

  const proposalScores = sessions.map((session) => session.publishedProposal?.proposalScore ?? 0).filter((value) => value > 0);
  const adminRatings = sessions.map((session) => session.publishedProposal?.rating?.rating ?? null).filter((value): value is number => value !== null).map((value) => value / 5);
  const outcomeScores = sessions
    .flatMap((session) => session.publishedProposal?.speakerScoreRecords ?? [])
    .map((record) => record.teamResultPoints / 3);
  const chairFeedbackScores = sessions
    .flatMap((session) => session.publishedProposal?.chairFeedbackRecords ?? [])
    .map((record) => record.rating / 10);

  const averageProposalScore = average(proposalScores) ?? 0;
  const averageAdminRating = average(adminRatings);
  const averageOutcomeScore = average(outcomeScores);
  const averageChairFeedback = average(chairFeedbackScores);

  const signals = new Map<string, number>([
    ["speaker_total_score", (averageOutcomeScore ?? averageProposalScore) - averageProposalScore],
    ["adjudicator_average_score", (averageAdminRating ?? averageProposalScore) - averageProposalScore],
    ["chair_score", (averageChairFeedback ?? averageProposalScore) - averageProposalScore],
  ]);

  return metricDefinitions
    .filter((definition) => signals.has(definition.key))
    .map((definition) => {
      const rawSignal = signals.get(definition.key) ?? 0;
      const suggestedDelta = clamp(Number((rawSignal * 0.03).toFixed(4)), -0.03, 0.03);
      const suggestedAdjustment = clamp(Number((definition.currentAdjustment + suggestedDelta).toFixed(4)), -0.03, 0.03);
      return {
        metricKey: definition.key,
        currentAdjustment: definition.currentAdjustment,
        suggestedDelta,
        suggestedAdjustment,
        reason: "Review-assisted V1 suggestion derived from proposal-score gap versus observed window signals; not auto-applied.",
        requiresReview: true as const,
      };
    });
}

export async function buildTuningReview(
  window: TuningWindowInput,
  repository: TuningRepositoryContract = evalRepository as TuningRepositoryContract,
): Promise<TuningReviewResult> {
  const sessions = await repository.getTuningWindowDataset(window);
  const suggestions = await suggestMetricAdjustments(window, repository);
  const proposalIds = sessions.map((session) => session.publishedProposal?.id).filter((value): value is string => !!value);
  const proposalScores = sessions.map((session) => session.publishedProposal?.proposalScore ?? 0).filter((value) => value > 0);
  const adminRatings = sessions.map((session) => session.publishedProposal?.rating?.rating ?? null).filter((value): value is number => value !== null);
  const outcomeScores = sessions.flatMap((session) => session.publishedProposal?.speakerScoreRecords ?? []).map((record) => record.teamResultPoints / 3);
  const chairFeedbackScores = sessions.flatMap((session) => session.publishedProposal?.chairFeedbackRecords ?? []).map((record) => record.rating / 10);

  const analysisJson = {
    averageProposalScore: average(proposalScores) ?? 0,
    averageAdminRating: average(adminRatings),
    averageOutcomeScore: average(outcomeScores),
    averageChairFeedback: average(chairFeedbackScores),
    suggestions,
  };

  const reviewWindow = await repository.createTuningReviewWindowRecord({
    windowStartSessionId: window.windowStartSessionId,
    windowEndSessionId: window.windowEndSessionId,
    sessionCount: sessions.length,
    analysisJson,
    status: "REVIEW_REQUIRED",
  });

  await repository.createMetricAdjustmentHistoryRecords(reviewWindow.id, suggestions);

  return {
    windowId: reviewWindow.id,
    windowStartSessionId: window.windowStartSessionId,
    windowEndSessionId: window.windowEndSessionId,
    sessionCount: sessions.length,
    relatedProposalIds: proposalIds,
    tuningMode: window.tuningMode,
    analysisJson,
  };
}
