import { describe, it, expect } from "vitest";
import { validateRubricShape } from "./rubric-shape";

describe("validateRubricShape", () => {
  it("accepts a valid CMGC rubric", () => {
    const data = {
      questions: [
        { id: "q1", section: "s1", question: "q?", option_a: "a", option_b: "b", option_c: "c" },
      ],
      weights: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 },
    };
    expect(validateRubricShape("cmgc-pde", data)).toEqual({ ok: true });
  });

  it("rejects a CMGC rubric with a missing weight key", () => {
    const data = {
      questions: [
        { id: "q1", section: "s1", question: "q?", option_a: "a", option_b: "b", option_c: "c" },
      ],
      weights: { A: 1, B: 1, C: 1, D: 1, E: 1 }, // missing F
    };
    const out = validateRubricShape("cmgc-pde", data);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/weights/i);
  });

  it("rejects non-object input", () => {
    const out = validateRubricShape("cmgc-pde", null);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/object/i);
  });

  it("rejects an unknown use case", () => {
    const out = validateRubricShape("nope", {});
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/use case/i);
  });
});
