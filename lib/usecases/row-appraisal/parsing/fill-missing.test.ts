import { describe, it, expect } from "vitest";
import type { EvaluationResult } from "../types";
import { fillMissingCategories } from "./fill-missing";
import { VALID_CATEGORIES } from "../data/valid-categories";

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

describe("fillMissingCategories", () => {
  it("adds placeholder Error entries for the 2 missing categories out of 34", () => {
    const allCats = [...VALID_CATEGORIES];
    // omit last 2
    const present = allCats.slice(0, 32).map(makeResult);
    const result = fillMissingCategories(present, allCats);
    expect(result).toHaveLength(34);
    const added = result.slice(32);
    for (const entry of added) {
      expect(entry.status).toBe("❌ Error");
      expect(entry.score).toBe(0);
      expect(entry.criteria_met).toBe("Evaluation not completed");
      expect(entry.evidence).toBe("Category not evaluated by LLM");
      expect(entry.comments).toBe("Missing from chunked evaluation");
    }
    expect(added[0]!.category).toBe(allCats[32]);
    expect(added[1]!.category).toBe(allCats[33]);
  });

  it("returns input unchanged when all categories are present", () => {
    const allCats = [...VALID_CATEGORIES];
    const present = allCats.map(makeResult);
    const result = fillMissingCategories(present, allCats);
    expect(result).toHaveLength(34);
    // all original entries intact
    for (let i = 0; i < 34; i++) {
      expect(result[i]).toBe(present[i]);
    }
  });

  it("returns 3 Error entries for empty input with 3-category list", () => {
    const cats = ["A", "B", "C"];
    const result = fillMissingCategories([], cats);
    expect(result).toHaveLength(3);
    for (const entry of result) {
      expect(entry.status).toBe("❌ Error");
      expect(entry.score).toBe(0);
    }
    expect(result.map((r) => r.category)).toEqual(["A", "B", "C"]);
  });
});
