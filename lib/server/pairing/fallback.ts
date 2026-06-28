import type { FallbackMetricInput } from "./types.ts";

export function computeConfidence(observationCount: number, targetCount: number): number {
  if (targetCount <= 0) {
    return 1;
  }

  if (observationCount <= 0) {
    return 0;
  }

  return Math.min(observationCount / targetCount, 1);
}

export function blendSpecificWithFallback(
  specificMetric: number,
  fallbackMetric: number,
  confidence: number,
): number {
  const clampedConfidence = Math.min(Math.max(confidence, 0), 1);
  return clampedConfidence * specificMetric + (1 - clampedConfidence) * fallbackMetric;
}

export function resolveMetricWithFallback(input: FallbackMetricInput): number {
  const confidence = computeConfidence(input.observationCount, input.targetCount);
  return blendSpecificWithFallback(input.specificMetric, input.fallbackMetric, confidence);
}