import type { ScoredPairingCandidate, SelectionOptions, SelectionResult } from "./types.ts";
import { TOP_BAND_SIZE } from "./types.ts";

const rankProbabilities = [0.3, 0.24, 0.18, 0.15, 0.13] as const;

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function selectProposalFromTopBand(
  candidates: ScoredPairingCandidate[],
  options: SelectionOptions,
): SelectionResult {
  if (candidates.length === 0) {
    throw new Error("Cannot select from an empty candidate set.");
  }

  const topBandSize = Math.min(options.topBandSize ?? TOP_BAND_SIZE, candidates.length, rankProbabilities.length);
  const rankedCandidates = candidates
    .slice()
    .sort((left, right) => right.proposalScore - left.proposalScore)
    .slice(0, topBandSize);
  const probabilities = rankProbabilities.slice(0, topBandSize);
  const totalProbability = probabilities.reduce((sum, probability) => sum + probability, 0);
  const normalizedProbabilities = probabilities.map((probability) => probability / totalProbability);

  const random = createSeededRandom(options.seed);
  const threshold = random();
  let cumulative = 0;

  for (let index = 0; index < rankedCandidates.length; index++) {
    cumulative += normalizedProbabilities[index];
    if (threshold <= cumulative || index === rankedCandidates.length - 1) {
      return {
        candidate: rankedCandidates[index],
        audit: {
          seed: options.seed,
          selectedRank: index + 1,
          selectedProbability: normalizedProbabilities[index],
          topBandSize,
        },
      };
    }
  }

  return {
    candidate: rankedCandidates[0],
    audit: {
      seed: options.seed,
      selectedRank: 1,
      selectedProbability: normalizedProbabilities[0],
      topBandSize,
    },
  };
}