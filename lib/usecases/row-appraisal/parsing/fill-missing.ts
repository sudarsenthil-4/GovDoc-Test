import type { EvaluationResult } from "../types";

export function fillMissingCategories(
  results: EvaluationResult[],
  allCategories: string[],
): EvaluationResult[] {
  const present = new Set(results.map((r) => r.category));
  const out = [...results];
  for (const cat of allCategories) {
    if (!present.has(cat)) {
      out.push({
        category: cat,
        score: 0,
        criteria_met: "Evaluation not completed",
        evidence: "Category not evaluated by LLM",
        status: "❌ Error",
        comments: "Missing from chunked evaluation",
      });
    }
  }
  return out;
}
