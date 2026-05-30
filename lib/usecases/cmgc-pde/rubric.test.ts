import { describe, it, expect } from "vitest";
import { RUBRIC_QUESTIONS, SECTION_WEIGHTS, RATING_VALUES, ALL_METHODS } from "./rubric";

describe("CMGC rubric data", () => {
  it("has exactly 25 questions across sections A-F", () => {
    expect(RUBRIC_QUESTIONS).toHaveLength(25);
    const sections = new Set(RUBRIC_QUESTIONS.map((q) => q.id[0]));
    expect([...sections].sort()).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("section weights sum to 1.0 ± 0.001", () => {
    const total = Object.values(SECTION_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 3);
  });

  it("each question has id, section, question, option_a, option_b, option_c", () => {
    for (const q of RUBRIC_QUESTIONS) {
      expect(q.id).toMatch(/^[A-F]\d+$/);
      expect(q.section).toBeTruthy();
      expect(q.question).toBeTruthy();
      expect(q.option_a).toBeTruthy();
      expect(q.option_b).toBeTruthy();
      expect(q.option_c).toBeTruthy();
    }
  });

  it("RATING_VALUES maps A=1, B=2, C=3", () => {
    expect(RATING_VALUES).toEqual({ A: 1, B: 2, C: 3 });
  });

  it("lists 6 delivery methods", () => {
    expect(ALL_METHODS).toEqual([
      "Design-Bid-Build",
      "Design-Sequencing",
      "Design-Build/Low-Bid",
      "Design-Build/Best-Value",
      "CM/GC",
      "Progressive Design-Build",
    ]);
  });

  it("question IDs match expected set", () => {
    const ids = RUBRIC_QUESTIONS.map((q) => q.id);
    expect(ids).toEqual([
      "A1","A2","A3","A4","A5","A6","A7","A8","A9","A10",
      "B1","B2",
      "C1","C2",
      "D1","D2","D3",
      "E1","E2","E3","E4","E5",
      "F1","F2","F3",
    ]);
  });
});
