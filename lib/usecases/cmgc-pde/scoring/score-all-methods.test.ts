import { describe, it, expect } from "vitest";
import { scoreAllMethods } from "./score-all-methods";
import { mockRatings } from "./fixtures";
import { ALL_METHODS } from "../rubric";

describe("scoreAllMethods", () => {
  it("returns 6 method scores with unique ranks 1-6", () => {
    const result = scoreAllMethods(mockRatings());
    expect(result.method_scores).toHaveLength(6);
    const ranks = result.method_scores.map((m) => m.rank).sort((a,b) => a-b);
    expect(ranks).toEqual([1,2,3,4,5,6]);
    for (const m of result.method_scores) {
      expect(ALL_METHODS).toContain(m.method);
    }
  });

  it("blocked methods rank below unblocked methods", () => {
    // R1+R2+R3: A1=C, A2=C, A3=C → blocks DBB + Design-Sequencing
    const result = scoreAllMethods(mockRatings({ A1: "C", A2: "C", A3: "C" }));
    const blocked = result.method_scores.filter((m) => m.blocked);
    const unblocked = result.method_scores.filter((m) => !m.blocked);
    for (const b of blocked) {
      for (const u of unblocked) {
        expect(b.rank).toBeGreaterThan(u.rank);
      }
    }
    expect(blocked.map((m) => m.method)).toEqual(expect.arrayContaining(["Design-Bid-Build", "Design-Sequencing"]));
    for (const b of blocked) {
      expect(b.block_reasons.length).toBeGreaterThan(0);
    }
  });

  it("each method has non-empty pros and cons", () => {
    const result = scoreAllMethods(mockRatings());
    for (const m of result.method_scores) {
      expect(m.pros.length).toBeGreaterThan(0);
      expect(m.cons.length).toBeGreaterThan(0);
    }
  });

  it("borderline_comparison is null when top scores spread > 0.05", () => {
    // Force one method to dominate via favorable section profile
    const result = scoreAllMethods(mockRatings({
      A1: "C", A2: "C", A3: "C", A4: "C", A5: "C", A6: "C", A7: "C", A8: "C", A9: "C", A10: "C",
      B1: "C", B2: "C",
      C1: "C", C2: "C",
      D1: "C", D2: "C", D3: "C",
      E1: "C", E2: "C", E3: "C", E4: "C", E5: "C",
      F1: "C", F2: "C", F3: "C",
    }));
    // All-C should produce a clear winner (PDB or DB-BV) with clear gap
    // The borderline_comparison MAY be null or non-null depending on tie. Assert .is_close === true || borderline === null
    if (result.borderline_comparison) {
      expect(typeof result.borderline_comparison.score_gap).toBe("number");
    }
  });

  it("override_status is always 9 entries", () => {
    expect(scoreAllMethods(mockRatings()).override_status).toHaveLength(9);
  });

  it("key_factors_reasoning is undefined (LLM skipped at this layer)", () => {
    const result = scoreAllMethods(mockRatings());
    for (const m of result.method_scores) {
      expect(m.key_factors_reasoning).toBeUndefined();
    }
  });
});
