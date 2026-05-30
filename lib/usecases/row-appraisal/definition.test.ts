import { describe, it, expect } from "vitest";
import { rowAppraisal } from "./definition";

describe("rowAppraisal definition", () => {
  it("has id 'row-appraisal'", () => {
    expect(rowAppraisal.id).toBe("row-appraisal");
  });

  it("has tile 'review'", () => {
    expect(rowAppraisal.tile).toBe("review");
  });

  it("has resultView.kind 'score-table'", () => {
    expect(rowAppraisal.resultView.kind).toBe("score-table");
  });

  it("has a 3-step pipeline with ids [extract, evaluate, consolidate]", () => {
    expect(rowAppraisal.pipeline).toHaveLength(3);
    expect(rowAppraisal.pipeline.map((s) => s.id)).toEqual(["extract", "evaluate", "consolidate"]);
  });

  it("has 2 exporters with ids [xlsx, docx]", () => {
    expect(rowAppraisal.exporters).toHaveLength(2);
    expect(rowAppraisal.exporters.map((e) => e.id)).toEqual(["xlsx", "docx"]);
  });

  it("has 2 inputs with ids [pdf, model]", () => {
    expect(rowAppraisal.inputs).toHaveLength(2);
    expect(rowAppraisal.inputs.map((i) => i.id)).toEqual(["pdf", "model"]);
  });
});
