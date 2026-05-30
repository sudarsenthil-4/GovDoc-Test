import { describe, it, expect } from "vitest";
import {
  computeRatingsBreakdown,
  computeDeliveryRecommendation,
} from "./compute-recommendation";
import { mockRatings } from "./fixtures";

describe("computeRatingsBreakdown", () => {
  it("all-A ratings → composite 1.0, every section_score 1.0", () => {
    const ratings = mockRatings(Object.fromEntries(
      ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","B1","B2","C1","C2","D1","D2","D3","E1","E2","E3","E4","E5","F1","F2","F3"].map((k) => [k, "A"])
    ));
    const r = computeRatingsBreakdown(ratings);
    expect(r.composite).toBe(1.0);
    for (const s of ["A","B","C","D","E","F"]) {
      expect(r.section_scores[s]).toBe(1.0);
    }
  });

  it("all-C ratings → composite 3.0", () => {
    const ratings = mockRatings(Object.fromEntries(
      ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","B1","B2","C1","C2","D1","D2","D3","E1","E2","E3","E4","E5","F1","F2","F3"].map((k) => [k, "C"])
    ));
    const r = computeRatingsBreakdown(ratings);
    expect(r.composite).toBe(3.0);
  });

  it("default all-B fixture → composite 2.0 exactly", () => {
    const r = computeRatingsBreakdown(mockRatings());
    expect(r.composite).toBe(2.0);
  });

  it("mixed ratings produce expected composite within 0.001", () => {
    // A1=C (raw 3), A2=A (raw 1), rest B (raw 2)
    // Section A: (3+1+2+2+2+2+2+2+2+2)/10 = 2.0
    // All sections = 2.0 → composite = 2.0
    const r = computeRatingsBreakdown(mockRatings({ A1: "C", A2: "A" }));
    expect(r.composite).toBeCloseTo(2.0, 3);

    // Now drive A higher: A1..A10 all C
    const idsA = ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"] as const;
    const r2 = computeRatingsBreakdown(mockRatings(
      Object.fromEntries(idsA.map((k) => [k, "C" as const]))
    ));
    // A: 3.0, others 2.0 → composite = 3.0*0.30 + 2.0*0.70 = 0.9 + 1.4 = 2.3
    expect(r2.composite).toBeCloseTo(2.3, 3);
  });

  it("key_drivers returns top 5 by weighted_contribution desc", () => {
    const r = computeRatingsBreakdown(mockRatings({
      A1: "C", A2: "C", B1: "C", E1: "C", F1: "C",  // 5 high contributors
    }));
    expect(r.key_drivers).toHaveLength(5);
    for (let i = 1; i < 5; i++) {
      expect(r.key_drivers[i - 1]!.weighted_contribution).toBeGreaterThanOrEqual(
        r.key_drivers[i]!.weighted_contribution,
      );
    }
  });

  it("rating_lookup is a flat Record<qid, Rating>", () => {
    const r = computeRatingsBreakdown(mockRatings({ A1: "C", F3: "A" }));
    expect(r.rating_lookup.A1).toBe("C");
    expect(r.rating_lookup.F3).toBe("A");
    expect(r.rating_lookup.B1).toBe("B");  // default from mockRatings
  });

  it("section_scores rounded to 3 decimals", () => {
    const r = computeRatingsBreakdown(mockRatings({ A1: "A", A2: "C" }));
    // Section A: (1+3+2+2+2+2+2+2+2+2)/10 = 2.0 — round3 = 2.000
    expect(r.section_scores.A).toBe(2.0);
  });

  it("weighted_scores rounded to 4 decimals", () => {
    const r = computeRatingsBreakdown(mockRatings());
    // 2.0 * 0.30 = 0.6; 2.0 * 0.13 = 0.26
    expect(r.weighted_scores.A).toBe(0.6);
    expect(r.weighted_scores.F).toBe(0.26);
  });
});

describe("computeDeliveryRecommendation", () => {
  it("returns RecommendationResult with all expected keys", () => {
    const result = computeDeliveryRecommendation(mockRatings());
    expect(result).toHaveProperty("composite_score");
    expect(result).toHaveProperty("section_scores");
    expect(result).toHaveProperty("raw_scores");
    expect(result).toHaveProperty("weighted_scores");
    expect(result).toHaveProperty("key_drivers");
    expect(result).toHaveProperty("override_status");
    expect(result).toHaveProperty("recommended_method");
    expect(result).toHaveProperty("recommended_score");
    expect(result).toHaveProperty("runner_up_method");
    expect(result).toHaveProperty("runner_up_score");
    expect(result).toHaveProperty("is_borderline");
    expect(result).toHaveProperty("comparison_text");
    expect(result).toHaveProperty("override_reasons");
  });

  it("breakdown values match computeRatingsBreakdown output", () => {
    const ratings = mockRatings({ A1: "C", E3: "A" });
    const breakdown = computeRatingsBreakdown(ratings);
    const result = computeDeliveryRecommendation(ratings);
    expect(result.composite_score).toBe(breakdown.composite);
    expect(result.section_scores).toEqual(breakdown.section_scores);
    expect(result.weighted_scores).toEqual(breakdown.weighted_scores);
    expect(result.key_drivers).toEqual(breakdown.key_drivers);
  });

  it("all-B mockRatings (composite 2.0) → CM/GC recommended, Design-Build/Best-Value runner_up", () => {
    const result = computeDeliveryRecommendation(mockRatings());
    expect(result.recommended_method).toBe("CM/GC");
    expect(result.runner_up_method).toBe("Design-Build/Best-Value");
  });

  it("all-B mockRatings (composite 2.0) → is_borderline true (|2.0-2.10|=0.10 < 0.15)", () => {
    const result = computeDeliveryRecommendation(mockRatings());
    expect(result.is_borderline).toBe(true);
  });

  it("mockRatings({ A1: 'C' }) → override applied, recommended_method not DBB", () => {
    const result = computeDeliveryRecommendation(mockRatings({ A1: "C" }));
    expect(result.override_reasons.length).toBeGreaterThanOrEqual(1);
    expect(result.recommended_method).not.toBe("Design-Bid-Build");
  });

  it("override_status always has 9 entries", () => {
    expect(computeDeliveryRecommendation(mockRatings()).override_status).toHaveLength(9);
    expect(computeDeliveryRecommendation(mockRatings({ A1: "C" })).override_status).toHaveLength(9);
  });

  it("M6 recommended_score and runner_up_score are back-filled (non-zero)", () => {
    const result = computeDeliveryRecommendation(mockRatings());
    expect(result.recommended_score).toBeGreaterThan(0);
    expect(result.runner_up_method).not.toBeNull();
    expect(result.runner_up_score).toBeTypeOf("number");
    expect((result.runner_up_score as number)).toBeGreaterThan(0);
  });

  it("comparison_text is non-empty when is_borderline is true", () => {
    const result = computeDeliveryRecommendation(mockRatings());
    // all-B → composite 2.0 → is_borderline true
    expect(result.is_borderline).toBe(true);
    expect(result.comparison_text.length).toBeGreaterThan(0);
    expect(result.comparison_text).toContain("Project Composite Score:");
  });

  it("comparison_text is empty when not borderline", () => {
    // All-A → composite 1.0 → is_borderline false (far from any threshold)
    const allA = Object.fromEntries(
      ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","B1","B2","C1","C2","D1","D2","D3","E1","E2","E3","E4","E5","F1","F2","F3"].map((k) => [k, "A" as const])
    );
    const result = computeDeliveryRecommendation(mockRatings(allA));
    if (!result.is_borderline) {
      expect(result.comparison_text).toBe("");
    }
  });
});
