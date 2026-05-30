import type { CmgcRunResult, CmgcRating } from "./types";

export type ComposeOutput =
  | { kind: "ok"; value: CmgcRunResult }
  | { kind: "debug"; error: string; raw: unknown };

export function composeCmgcResult(raw: unknown): ComposeOutput {
  if (!raw || typeof raw !== "object") {
    return { kind: "debug", error: "payload is not an object", raw };
  }

  const r = raw as Record<string, unknown>;
  const evaluate = r["evaluate"] as Record<string, unknown> | undefined;
  const score = r["score"] as Record<string, unknown> | undefined;
  const extract = r["extract"] as { projectName?: string } | undefined;

  // Validate evaluate.ratings
  if (!evaluate || !Array.isArray(evaluate["ratings"])) {
    return {
      kind: "debug",
      error: "evaluate.ratings is missing or not an array",
      raw,
    };
  }

  const rawRatings = evaluate["ratings"] as unknown[];
  for (let i = 0; i < rawRatings.length; i++) {
    const rating = rawRatings[i];
    if (!rating || typeof rating !== "object") {
      return {
        kind: "debug",
        error: `evaluate.ratings[${i}]: expected object, got ${typeof rating}`,
        raw,
      };
    }
    const rObj = rating as Record<string, unknown>;
    if (typeof rObj["question_id"] !== "string") {
      return {
        kind: "debug",
        error: `evaluate.ratings[${i}]: missing or non-string question_id`,
        raw,
      };
    }
    // selected_rating is allowed to be missing/empty when the narrative lacks
    // evidence for the question (paired with missing_info: true). Anything other
    // than A/B/C/empty/null/undefined is a payload shape error.
    const sr = rObj["selected_rating"];
    if (sr !== undefined && sr !== null && sr !== "" && sr !== "A" && sr !== "B" && sr !== "C") {
      return {
        kind: "debug",
        error: `evaluate.ratings[${i}]: selected_rating must be "A", "B", "C", or empty (got ${JSON.stringify(sr)})`,
        raw,
      };
    }
    if (typeof rObj["confidence"] !== "number") {
      return {
        kind: "debug",
        error: `evaluate.ratings[${i}]: missing or non-number confidence`,
        raw,
      };
    }
    if (typeof rObj["missing_info"] !== "boolean") {
      return {
        kind: "debug",
        error: `evaluate.ratings[${i}]: missing or non-boolean missing_info`,
        raw,
      };
    }
  }

  // Validate score.recommendation and score.multi_method
  if (!score || typeof score["recommendation"] === "undefined") {
    return {
      kind: "debug",
      error: "score.recommendation is missing",
      raw,
    };
  }
  if (score["multi_method"] === undefined || score["multi_method"] === null) {
    return {
      kind: "debug",
      error: "score.multi_method is missing",
      raw,
    };
  }

  return {
    kind: "ok",
    value: {
      evaluation: {
        project_name: extract?.projectName ?? "Untitled Project",
        project_ea: "",
        district: "",
        evaluation_date: new Date().toISOString().slice(0, 10),
        ratings: rawRatings as CmgcRating[],
        missing_questions: [],
        summary: "",
      },
      recommendation: score["recommendation"] as unknown as CmgcRunResult["recommendation"],
      multi_method: score["multi_method"] as unknown as CmgcRunResult["multi_method"],
    },
  };
}
