export const SPAR_SUCCESS_MESSAGE = "SPAR submitted successfully.";
export const SPAR_SUCCESS_DURATION_MS = 12_000;

export type SparRankMarker = {
  kind: "trophy" | "medal" | "numeric";
  label: string;
  tone: "gold" | "silver" | "bronze" | "numeric";
};

function ordinalSuffix(rank: number) {
  const lastTwoDigits = rank % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return "th";
  if (rank % 10 === 1) return "st";
  if (rank % 10 === 2) return "nd";
  if (rank % 10 === 3) return "rd";
  return "th";
}

export function getSparRankMarker(rank: number): SparRankMarker {
  if (rank === 1) return { kind: "trophy", label: "1st place", tone: "gold" };
  if (rank === 2) return { kind: "medal", label: "2nd place", tone: "silver" };
  if (rank === 3) return { kind: "medal", label: "3rd place", tone: "bronze" };
  return { kind: "numeric", label: `${rank}${ordinalSuffix(rank)} place`, tone: "numeric" };
}
