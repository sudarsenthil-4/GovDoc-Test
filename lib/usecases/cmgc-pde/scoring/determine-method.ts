import type { Rating } from "../rubric";

const THRESHOLDS = [1.40, 1.70, 2.10, 2.50, 3.01] as const;

function midRangeMethod(
  sectionScores: Record<string, number>,
  ratingLookup: Record<string, Rating>,
): [string, string] {
  const a_avg = sectionScores.A ?? 2.0;
  const b_avg = sectionScores.B ?? 2.0;
  const c_avg = sectionScores.C ?? 2.0;

  if (b_avg >= 2.5 && c_avg >= 2.0) return ["Design-Build/Best-Value", "CM/GC"];
  if (b_avg >= 2.5 && c_avg < 2.0) return ["Design-Build/Low-Bid", "CM/GC"];
  if (a_avg >= 2.5 && ratingLookup.A3 === "C" && ratingLookup.E3 === "C") {
    return ["Progressive Design-Build", "CM/GC"];
  }
  if (c_avg >= 2.0) return ["CM/GC", "Design-Build/Best-Value"];
  return ["CM/GC", "Design-Sequencing"];
}

function upperRangeMethod(
  sectionScores: Record<string, number>,
  ratingLookup: Record<string, Rating>,
): [string, string] {
  const c_avg = sectionScores.C ?? 2.0;
  const d_avg = sectionScores.D ?? 2.0;
  const f_avg = sectionScores.F ?? 2.0;

  if (c_avg < 1.5) return ["Design-Build/Low-Bid", "CM/GC"];
  if (c_avg >= 2.0 && d_avg >= 2.0) return ["Design-Build/Best-Value", "Progressive Design-Build"];
  if (f_avg >= 2.5) return ["CM/GC", "Progressive Design-Build"];
  if (ratingLookup.A3 === "C" && ratingLookup.E3 === "C") {
    return ["Progressive Design-Build", "Design-Build/Best-Value"];
  }
  return ["CM/GC", "Design-Build/Best-Value"];
}

export function determineMethod(
  composite: number,
  sectionScores: Record<string, number>,
  ratingLookup: Record<string, Rating>,
): { recommended: string; runnerUp: string; isBorderline: boolean } {
  const isBorderline = THRESHOLDS.some((t) => Math.abs(composite - t) < 0.15);

  let recommended: string;
  let runnerUp: string;

  if (composite <= 1.40) {
    recommended = "Design-Bid-Build";
    runnerUp = "Design-Sequencing";
  } else if (composite <= 1.70) {
    recommended = "Design-Sequencing";
    runnerUp = composite < 1.55 ? "Design-Bid-Build" : "CM/GC";
  } else if (composite <= 2.10) {
    [recommended, runnerUp] = midRangeMethod(sectionScores, ratingLookup);
  } else if (composite <= 2.50) {
    [recommended, runnerUp] = upperRangeMethod(sectionScores, ratingLookup);
  } else {
    recommended = "Progressive Design-Build";
    runnerUp = "CM/GC";
  }

  return { recommended, runnerUp, isBorderline };
}
