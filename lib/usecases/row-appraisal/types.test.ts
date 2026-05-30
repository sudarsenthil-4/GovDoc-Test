import { describe, it, expectTypeOf } from "vitest";
import type { Status, EvaluationResult, RowRunResult } from "./types";

describe("ROW types", () => {
  it("Status union has the 5 expected values", () => {
    expectTypeOf<Status>().toEqualTypeOf<
      "✅ Pass" | "⚠️ Warning" | "❌ Fail" | "⚪ N/A" | "❌ Error"
    >();
  });

  it("EvaluationResult has all expected fields", () => {
    expectTypeOf<EvaluationResult>().toHaveProperty("category");
    expectTypeOf<EvaluationResult>().toHaveProperty("score");
    expectTypeOf<EvaluationResult>().toHaveProperty("criteria_met");
    expectTypeOf<EvaluationResult>().toHaveProperty("evidence");
    expectTypeOf<EvaluationResult>().toHaveProperty("status");
    expectTypeOf<EvaluationResult>().toHaveProperty("comments");
  });

  it("EvaluationResult.score is a number", () => {
    expectTypeOf<EvaluationResult["score"]>().toEqualTypeOf<number>();
  });

  it("EvaluationResult.status is Status", () => {
    expectTypeOf<EvaluationResult["status"]>().toEqualTypeOf<Status>();
  });

  it("RowRunResult has all expected top-level keys", () => {
    expectTypeOf<RowRunResult>().toHaveProperty("pdf_filename");
    expectTypeOf<RowRunResult>().toHaveProperty("markdown_asset");
    expectTypeOf<RowRunResult>().toHaveProperty("evaluation_results");
    expectTypeOf<RowRunResult>().toHaveProperty("markdown_table");
    expectTypeOf<RowRunResult>().toHaveProperty("evaluation_date");
  });

  it("RowRunResult.evaluation_results is an array of EvaluationResult", () => {
    expectTypeOf<RowRunResult["evaluation_results"]>().toEqualTypeOf<EvaluationResult[]>();
  });
});
