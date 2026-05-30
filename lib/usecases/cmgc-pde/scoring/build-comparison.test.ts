import { describe, it, expect } from "vitest";
import { buildComparisonText } from "./build-comparison";

describe("buildComparisonText", () => {
  const sectionScores = { A: 2.0, B: 2.0, C: 2.0, D: 2.0, E: 2.0, F: 2.0 };

  it("contains the project composite score in X.XX / 3.00 format", () => {
    const text = buildComparisonText({ recommended: "CM/GC", runnerUp: "Design-Build/Best-Value", composite: 1.95, sectionScores });
    expect(text).toContain("Project Composite Score: 1.95 / 3.00");
  });

  it("mentions both methods when runner-up present", () => {
    const text = buildComparisonText({ recommended: "CM/GC", runnerUp: "Design-Build/Best-Value", composite: 1.95, sectionScores });
    expect(text).toContain("**CM/GC**");
    expect(text).toContain("**Design-Build/Best-Value**");
  });

  it("includes Method Suitability section when scores provided", () => {
    const text = buildComparisonText({
      recommended: "CM/GC", runnerUp: "Design-Build/Best-Value",
      composite: 1.95, sectionScores,
      recommendedScore: 0.7, runnerUpScore: 0.65,
    });
    expect(text).toContain("Method Suitability");
    expect(text).toContain("0.7000");
    expect(text).toContain("0.6500");
  });

  it("omits Method Suitability section when scores not provided", () => {
    const text = buildComparisonText({ recommended: "CM/GC", runnerUp: "DB-BV", composite: 1.95, sectionScores });
    expect(text).not.toContain("Method Suitability");
  });

  it("includes all 6 section names in the section-scores block", () => {
    const text = buildComparisonText({ recommended: "CM/GC", runnerUp: "DB-BV", composite: 1.95, sectionScores });
    expect(text).toContain("Project Scope & Characteristics");
    expect(text).toContain("Schedule Issues");
    expect(text).toContain("Opportunity for Innovation");
    expect(text).toContain("Quality Enhancement");
    expect(text).toContain("Cost Issues");
    expect(text).toContain("Staffing Issues");
  });

  it("each section line shows score / 3.00 + weight as percentage", () => {
    const text = buildComparisonText({ recommended: "CM/GC", runnerUp: "DB-BV", composite: 1.95, sectionScores });
    // Section A weight 30%, score 2.00
    expect(text).toMatch(/Project Scope & Characteristics: 2\.00 \/ 3\.00 \(weight: 30%\)/);
  });
});
