import { describe, it, expect } from "vitest";
import { composeCmgcReport, type ReportOverride } from "./compose-report";
import type { CmgcRunResult } from "./types";

function makeResult(): CmgcRunResult {
  return {
    evaluation: {
      project_name: "Test Project",
      project_ea: "",
      district: "",
      evaluation_date: "2026-05-13",
      ratings: [],
      missing_questions: [],
      summary: "Project is complex with moderate risk.",
    },
    recommendation: {
      composite_score: 2.612,
      section_scores: { "A": 2.5, "B": 2.7 },
      raw_scores: {},
      weighted_scores: {},
      override_status: [],
      key_drivers: [],
      recommended_method: "CM/GC",
      recommended_score: 2.612,
      runner_up_method: "DBB",
      runner_up_score: 2.345,
      is_borderline: false,
      comparison_text: "",
      override_reasons: [],
    },
    multi_method: {
      method_scores: [
        { method: "CM/GC", score: 2.612, rank: 1, blocked: false, block_reasons: [], pros: ["good for complex"], cons: ["needs strong owner"], key_factors: [] },
        { method: "DBB",   score: 2.345, rank: 2, blocked: false, block_reasons: [], pros: ["familiar"],         cons: ["slower"],            key_factors: [] },
      ],
      borderline_comparison: null,
      override_status: [],
    },
  };
}

describe("composeCmgcReport", () => {
  it("includes recommendation, composite score, and runner-up", () => {
    const md = composeCmgcReport(makeResult());
    expect(md).toContain("**Recommended method:** CM/GC");
    expect(md).toContain("2.612 / 3.000");
    expect(md).toContain("Runner-up: DBB (2.345)");
  });

  it("renders evaluation.summary when present", () => {
    const md = composeCmgcReport(makeResult());
    expect(md).toContain("## Summary");
    expect(md).toContain("Project is complex with moderate risk.");
  });

  it("renders Human overrides table when overrides are supplied", () => {
    const overrides: ReportOverride[] = [
      { question_id: "A1", oldValue: "B", newValue: "A", reason: "stronger evidence" },
    ];
    const md = composeCmgcReport(makeResult(), overrides);
    expect(md).toContain("## Human overrides (HIFL)");
    expect(md).toContain("| A1 | B → A | stronger evidence |");
  });

  it("skips Human overrides section when no overrides", () => {
    const md = composeCmgcReport(makeResult(), []);
    expect(md).not.toContain("## Human overrides");
  });

  it("escapes pipe characters in override reasons", () => {
    const overrides: ReportOverride[] = [
      { question_id: "A1", oldValue: "B", newValue: "A", reason: "a|b" },
    ];
    const md = composeCmgcReport(makeResult(), overrides);
    expect(md).toContain("a\\|b");
  });

  it("includes section scores table", () => {
    const md = composeCmgcReport(makeResult());
    expect(md).toContain("## Section scores");
    expect(md).toContain("| A | 2.50 / 3.00 |");
  });

  it("flags borderline results with a callout", () => {
    const r = makeResult();
    r.recommendation.is_borderline = true;
    const md = composeCmgcReport(r);
    expect(md).toMatch(/Borderline result/);
  });
});
