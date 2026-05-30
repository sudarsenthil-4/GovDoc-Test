import { describe, expect, it } from "vitest";
import { composeCmgcResult } from "./compose-result";

describe("composeCmgcResult", () => {
  it("parses a valid pipeline payload into a typed CmgcRunResult", () => {
    const out = composeCmgcResult({
      evaluate: {
        ratings: [
          {
            question_id: "A1",
            question_text: "Project size?",
            selected_rating: "B",
            confidence: 0.7,
            source_reasoning: "Plans show…",
            missing_info_reasoning: "",
            missing_info: false,
          },
        ],
      },
      score: {
        recommendation: { recommended_method: "CM/GC" },
        multi_method: { method_scores: [], borderline_comparison: null, override_status: [] },
      },
      extract: { projectName: "Hwy 99" },
    });
    expect(out.kind).toBe("ok");
    if (out.kind !== "ok") return;
    expect(out.value.evaluation.ratings[0]!.selected_rating).toBe("B");
    expect(out.value.evaluation.project_name).toBe("Hwy 99");
  });

  it("defaults project_name to 'Untitled Project' when extract is absent", () => {
    const out = composeCmgcResult({
      evaluate: {
        ratings: [
          {
            question_id: "B2",
            question_text: "Complexity?",
            selected_rating: "A",
            confidence: 0.9,
            source_reasoning: "",
            missing_info_reasoning: "",
            missing_info: false,
          },
        ],
      },
      score: {
        recommendation: { recommended_method: "DBB" },
        multi_method: { method_scores: [], borderline_comparison: null, override_status: [] },
      },
    });
    expect(out.kind).toBe("ok");
    if (out.kind !== "ok") return;
    expect(out.value.evaluation.project_name).toBe("Untitled Project");
  });

  it("returns debug when ratings are missing the question_id field", () => {
    const out = composeCmgcResult({
      evaluate: { ratings: [{ selected_rating: "B" }] },
      score: { recommendation: "x", multi_method: [] },
    });
    expect(out.kind).toBe("debug");
    if (out.kind !== "debug") return;
    expect(out.error).toMatch(/question_id/);
  });

  it("returns debug when score.recommendation is missing", () => {
    const out = composeCmgcResult({
      evaluate: { ratings: [] },
      score: { multi_method: [] },
    });
    expect(out.kind).toBe("debug");
    if (out.kind !== "debug") return;
    expect(out.error).toMatch(/recommendation/);
  });

  it("returns debug for non-object payload", () => {
    expect(composeCmgcResult(null).kind).toBe("debug");
    expect(composeCmgcResult("string").kind).toBe("debug");
  });

  it("returns debug when evaluate.ratings is not an array", () => {
    const out = composeCmgcResult({
      evaluate: { ratings: "not-an-array" },
      score: { recommendation: "x", multi_method: [] },
    });
    expect(out.kind).toBe("debug");
    if (out.kind !== "debug") return;
    expect(out.error).toMatch(/evaluate\.ratings/);
  });

  it("returns debug when score.multi_method is missing", () => {
    const out = composeCmgcResult({
      evaluate: { ratings: [] },
      score: { recommendation: "x" },
    });
    expect(out.kind).toBe("debug");
    if (out.kind !== "debug") return;
    expect(out.error).toMatch(/multi_method/);
  });

  it("returns debug when selected_rating is not a string", () => {
    const out = composeCmgcResult({
      evaluate: {
        ratings: [
          {
            question_id: "A1",
            question_text: "Q",
            selected_rating: 2, // wrong: number instead of string
            confidence: 0.7,
            source_reasoning: "",
            missing_info_reasoning: "",
            missing_info: false,
          },
        ],
      },
      score: { recommendation: "x", multi_method: [] },
    });
    expect(out.kind).toBe("debug");
    if (out.kind !== "debug") return;
    expect(out.error).toMatch(/selected_rating/);
  });

  it("accepts empty selected_rating as legitimate (e.g. narrative missing info)", () => {
    const out = composeCmgcResult({
      evaluate: {
        ratings: [
          {
            question_id: "A1",
            question_text: "Q",
            selected_rating: "",
            confidence: 0.0,
            source_reasoning: "",
            missing_info_reasoning: "No evidence for this question in sections 1-12.",
            missing_info: true,
          },
        ],
      },
      score: { recommendation: "x", multi_method: [] },
    });
    expect(out.kind).toBe("ok");
  });

  it("accepts null/undefined selected_rating as legitimate", () => {
    const out = composeCmgcResult({
      evaluate: {
        ratings: [
          {
            question_id: "A1",
            question_text: "Q",
            selected_rating: null,
            confidence: 0.0,
            source_reasoning: "",
            missing_info_reasoning: "",
            missing_info: true,
          },
        ],
      },
      score: { recommendation: "x", multi_method: [] },
    });
    expect(out.kind).toBe("ok");
  });

  it("returns debug when selected_rating is a valid string but not A/B/C", () => {
    const out = composeCmgcResult({
      evaluate: {
        ratings: [
          {
            question_id: "A1",
            question_text: "Q",
            selected_rating: "D",
            confidence: 0.7,
            source_reasoning: "",
            missing_info_reasoning: "",
            missing_info: false,
          },
        ],
      },
      score: { recommendation: "x", multi_method: [] },
    });
    expect(out.kind).toBe("debug");
    if (out.kind !== "debug") return;
    expect(out.error).toMatch(/selected_rating/);
  });

  it("returns debug when confidence is not a number", () => {
    const out = composeCmgcResult({
      evaluate: {
        ratings: [
          {
            question_id: "A1",
            question_text: "Q",
            selected_rating: "B",
            confidence: "high", // wrong: string
            source_reasoning: "",
            missing_info_reasoning: "",
            missing_info: false,
          },
        ],
      },
      score: { recommendation: "x", multi_method: [] },
    });
    expect(out.kind).toBe("debug");
    if (out.kind !== "debug") return;
    expect(out.error).toMatch(/confidence/);
  });

  it("accepts an empty ratings array as valid", () => {
    const out = composeCmgcResult({
      evaluate: { ratings: [] },
      score: { recommendation: "x", multi_method: [] },
    });
    expect(out.kind).toBe("ok");
  });
});
