export const SPAR_SCORE_MIN = 50;
export const SPAR_SCORE_MAX = 100;
export const SPAR_SCORE_STEP = 0.5;
export const SCORE_VALIDATION_MESSAGE = "Score must be between 50 and 100 in 0.5-point increments.";

const SPAR_SCORE_PATTERN = /^(?:[5-9]\d(?:\.[05])?|100(?:\.0)?)$/;

export function parseSparScore(value: string) {
  const normalized = value.trim();
  if (!normalized || !SPAR_SCORE_PATTERN.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= SPAR_SCORE_MIN && parsed <= SPAR_SCORE_MAX && parsed * 2 === Math.round(parsed * 2)
    ? parsed
    : null;
}

export function formatSparScore(value: number) {
  return Number(value.toFixed(1)).toString();
}

export function isValidSparScoreSet(values: readonly string[]) {
  return values.every((value) => parseSparScore(value) !== null);
}
