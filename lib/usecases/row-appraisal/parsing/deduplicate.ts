import type { EvaluationResult } from "../types";

export function deduplicateResults(results: EvaluationResult[]): EvaluationResult[] {
  const seen = new Set<string>();
  const out: EvaluationResult[] = [];
  for (const r of results) {
    if (!seen.has(r.category)) {
      out.push(r);
      seen.add(r.category);
    }
  }
  return out;
}
