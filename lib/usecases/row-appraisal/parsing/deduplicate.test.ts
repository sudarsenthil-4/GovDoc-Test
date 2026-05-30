import { describe, it, expect } from "vitest";
import type { EvaluationResult } from "../types";
import { deduplicateResults } from "./deduplicate";

function makeResult(category: string): EvaluationResult {
  return {
    category,
    score: 3,
    criteria_met: "ok",
    evidence: "e",
    status: "✅ Pass",
    comments: "c",
  };
}

describe("deduplicateResults", () => {
  it("removes duplicates keeping first occurrence", () => {
    const A = makeResult("A");
    const B = makeResult("B");
    const A2 = makeResult("A");
    const C = makeResult("C");
    const result = deduplicateResults([A, B, A2, C]);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(A);
    expect(result[1]).toBe(B);
    expect(result[2]).toBe(C);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateResults([])).toEqual([]);
  });

  it("returns all entries when no duplicates", () => {
    const items = [makeResult("X"), makeResult("Y"), makeResult("Z")];
    const result = deduplicateResults(items);
    expect(result).toHaveLength(3);
    expect(result).toEqual(items);
  });
});
