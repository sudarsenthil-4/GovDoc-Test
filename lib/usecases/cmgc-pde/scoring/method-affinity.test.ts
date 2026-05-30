import { describe, it, expect } from "vitest";
import { METHOD_AFFINITY, METHOD_PROS_CONS, affinityScoreForMethod } from "./method-affinity";
import { ALL_METHODS } from "../rubric";

describe("METHOD_AFFINITY", () => {
  it("has 6 sections × 6 methods × 3 ratings", () => {
    const sections = ["A","B","C","D","E","F"] as const;
    for (const s of sections) {
      expect(METHOD_AFFINITY[s]).toBeDefined();
      for (const m of ALL_METHODS) {
        expect(METHOD_AFFINITY[s][m]).toBeDefined();
        expect(METHOD_AFFINITY[s][m]!.A).toBeTypeOf("number");
        expect(METHOD_AFFINITY[s][m]!.B).toBeTypeOf("number");
        expect(METHOD_AFFINITY[s][m]!.C).toBeTypeOf("number");
      }
    }
  });
});

describe("METHOD_PROS_CONS", () => {
  it("has all 6 methods with non-empty pros and cons", () => {
    for (const m of ALL_METHODS) {
      expect(METHOD_PROS_CONS[m]).toBeDefined();
      expect(METHOD_PROS_CONS[m]!.pros.length).toBeGreaterThan(0);
      expect(METHOD_PROS_CONS[m]!.cons.length).toBeGreaterThan(0);
    }
  });
});

describe("affinityScoreForMethod", () => {
  it("all-B sections (raw 2.0 each) returns the middle (B) column weighted", () => {
    const sectionRatings = { A: [2,2,2,2,2,2,2,2,2,2], B: [2,2], C: [2,2], D: [2,2,2], E: [2,2,2,2,2], F: [2,2,2] };
    const dbb = affinityScoreForMethod("Design-Bid-Build", sectionRatings);
    // Σ DBB.B[sec] × SECTION_WEIGHTS[sec] = 0.6*0.30 + 0.5*0.15 + 0.5*0.12 + 0.5*0.10 + 0.6*0.20 + 0.5*0.13
    // = 0.18 + 0.075 + 0.06 + 0.05 + 0.12 + 0.065 = 0.55
    expect(dbb).toBeCloseTo(0.55, 2);
  });

  it("missing section ratings default to 'B' dominant (0.5 fallback)", () => {
    const sectionRatings = { A: [], B: [], C: [], D: [], E: [], F: [] };
    const score = affinityScoreForMethod("CM/GC", sectionRatings);
    expect(score).toBeGreaterThan(0);
  });

  it("all-3 sections (avg 3.0) maps to dominant 'A' in affinity table", () => {
    const sectionRatings = { A: [3,3,3,3,3,3,3,3,3,3], B: [3,3], C: [3,3], D: [3,3,3], E: [3,3,3,3,3], F: [3,3,3] };
    const dbb = affinityScoreForMethod("Design-Bid-Build", sectionRatings);
    // Σ DBB.A[sec] × SECTION_WEIGHTS[sec] = 1.0*0.30 + 0.9*0.15 + 0.9*0.12 + 0.8*0.10 + 0.8*0.20 + 0.8*0.13
    // = 0.30 + 0.135 + 0.108 + 0.08 + 0.16 + 0.104 = 0.887
    expect(dbb).toBeCloseTo(0.887, 2);
  });

  it("returns rounded to 4 decimals", () => {
    const sectionRatings = { A: [3,3,3,3,3,3,3,3,3,3], B: [3,3], C: [3,3], D: [3,3,3], E: [3,3,3,3,3], F: [3,3,3] };
    const score = affinityScoreForMethod("CM/GC", sectionRatings);
    const decimals = (String(score).split(".")[1] ?? "").length;
    expect(decimals).toBeLessThanOrEqual(4);
  });
});
