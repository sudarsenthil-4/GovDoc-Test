import { describe, it, expect } from "vitest";
import { USE_CASES, USE_CASES_BY_TILE, getUseCase } from "./registry";

describe("use case registry", () => {
  it("registers cmgcPde", () => {
    expect(USE_CASES.cmgcPde).toBeDefined();
    expect(USE_CASES.cmgcPde.id).toBe("cmgc-pde");
  });

  it("getUseCase('cmgc-pde') returns the cmgcPde use case", () => {
    const uc = getUseCase("cmgc-pde");
    expect(uc).toBeDefined();
    expect(uc?.id).toBe("cmgc-pde");
    expect(uc?.tile).toBe("review");
  });

  it("getUseCase returns undefined for unknown ids", () => {
    expect(getUseCase("nonexistent")).toBeUndefined();
  });

  it("USE_CASES_BY_TILE.review contains cmgcPde", () => {
    expect(USE_CASES_BY_TILE.review).toContain(USE_CASES.cmgcPde);
  });

  it("non-review tiles are empty arrays", () => {
    expect(USE_CASES_BY_TILE.search).toEqual([]);
    expect(USE_CASES_BY_TILE.draft).toEqual([]);
    expect(USE_CASES_BY_TILE.inbox).toEqual([]);
  });

  it("cmgcPde has a 3-step pipeline", () => {
    expect(USE_CASES.cmgcPde.pipeline).toHaveLength(3);
    expect(USE_CASES.cmgcPde.pipeline.map((s) => s.id)).toEqual(["extract", "evaluate", "score"]);
  });

  it("cmgcPde has 2 exporters (xlsx, docx)", () => {
    const ids = USE_CASES.cmgcPde.exporters.map((e) => e.id);
    expect(ids).toContain("xlsx");
    expect(ids).toContain("docx");
  });

  it("cmgcPde has 2 inputs", () => {
    expect(USE_CASES.cmgcPde.inputs).toHaveLength(2);
    const inputIds = USE_CASES.cmgcPde.inputs.map((i) => i.id);
    expect(inputIds).toEqual(["factSheet", "model"]);
  });

  it("registers cucpReevals", () => {
    expect(USE_CASES.cucpReevals).toBeDefined();
    expect(USE_CASES.cucpReevals.id).toBe("cucp-reevals");
  });

  it("getUseCase('cucp-reevals') returns the cucpReevals use case", () => {
    const uc = getUseCase("cucp-reevals");
    expect(uc).toBeDefined();
    expect(uc?.id).toBe("cucp-reevals");
    expect(uc?.tile).toBe("review");
  });

  it("USE_CASES_BY_TILE.review contains cucpReevals", () => {
    expect(USE_CASES_BY_TILE.review).toContain(USE_CASES.cucpReevals);
  });

  it("cucpReevals has a 5-step pipeline", () => {
    expect(USE_CASES.cucpReevals.pipeline).toHaveLength(5);
    expect(USE_CASES.cucpReevals.pipeline.map((s) => s.id)).toEqual([
      "extract",
      "level1",
      "level2",
      "level3",
      "report",
    ]);
  });

  it("cucpReevals has 3 exporters (xlsx, docx, json)", () => {
    const ids = USE_CASES.cucpReevals.exporters.map((e) => e.id);
    expect(ids).toEqual(["xlsx", "docx", "json"]);
  });

  it("cucpReevals has 3 inputs", () => {
    const inputIds = USE_CASES.cucpReevals.inputs.map((i) => i.id);
    expect(inputIds).toEqual(["narrative", "revenues", "model"]);
  });

  it("registers rowAppraisal", () => {
    expect(USE_CASES.rowAppraisal).toBeDefined();
    expect(USE_CASES.rowAppraisal.id).toBe("row-appraisal");
  });

  it("getUseCase('row-appraisal') returns the rowAppraisal use case", () => {
    const uc = getUseCase("row-appraisal");
    expect(uc).toBeDefined();
    expect(uc?.id).toBe("row-appraisal");
    expect(uc?.tile).toBe("review");
  });

  it("USE_CASES_BY_TILE.review contains rowAppraisal", () => {
    expect(USE_CASES_BY_TILE.review).toContain(USE_CASES.rowAppraisal);
  });

  it("rowAppraisal has a 3-step pipeline (extract, evaluate, consolidate)", () => {
    expect(USE_CASES.rowAppraisal.pipeline.map((s) => s.id)).toEqual(["extract", "evaluate", "consolidate"]);
  });

  it("rowAppraisal has 2 exporters (xlsx, docx)", () => {
    const ids = USE_CASES.rowAppraisal.exporters.map((e) => e.id);
    expect(ids).toEqual(["xlsx", "docx"]);
  });

  it("rowAppraisal has 2 inputs (pdf, model)", () => {
    const inputIds = USE_CASES.rowAppraisal.inputs.map((i) => i.id);
    expect(inputIds).toEqual(["pdf", "model"]);
  });
});
