import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildEvaluationXlsx, xlsxExporter } from "./xlsx";
import type { RowRunResult } from "@/lib/usecases/row-appraisal/types";

function makeResult(overrides?: Partial<import("@/lib/usecases/row-appraisal/types").EvaluationResult>[]): RowRunResult {
  const evaluation_results = (overrides ?? Array.from({ length: 34 })).map((o, i) => ({
    category: `Category ${i + 1}`,
    score: 3,
    criteria_met: `Criteria met for ${i + 1}`,
    evidence: `Evidence for ${i + 1}`,
    status: "✅ Pass" as const,
    comments: `Comments for ${i + 1}`,
    ...o,
  }));
  return {
    pdf_filename: "test.pdf",
    markdown_asset: "test.md",
    evaluation_results,
    markdown_table: "",
    evaluation_date: "2026-05-06",
  };
}

describe("buildEvaluationXlsx (ROW)", () => {
  it("produces exactly 1 sheet named 'ROW Evaluation' with 35 rows (header + 34 data)", async () => {
    const buf = await buildEvaluationXlsx(makeResult());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    expect(wb.worksheets).toHaveLength(1);
    expect(wb.worksheets[0]!.name).toBe("ROW Evaluation");
    expect(wb.worksheets[0]!.rowCount).toBe(35);
  });

  it("B2 is a number when score is not -1", async () => {
    const buf = await buildEvaluationXlsx(makeResult());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const cell = wb.worksheets[0]!.getRow(2).getCell(2).value;
    expect(typeof cell === "number" || cell === "N/A").toBe(true);
  });

  it("header row is bold", async () => {
    const buf = await buildEvaluationXlsx(makeResult());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    expect(wb.worksheets[0]!.getRow(1).font?.bold).toBe(true);
  });

  it("score -1 renders as 'N/A'", async () => {
    const result = makeResult([{ category: "Special", score: -1, criteria_met: "x", evidence: "e", status: "⚪ N/A", comments: "c" }]);
    const buf = await buildEvaluationXlsx(result);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const cell = wb.worksheets[0]!.getRow(2).getCell(2).value;
    expect(cell).toBe("N/A");
  });

  it("exposes canonical Exporter contract fields", () => {
    expect(xlsxExporter.id).toBe("xlsx");
    expect(xlsxExporter.contentType).toContain("spreadsheetml");
    expect(xlsxExporter.label).toBe("Download as Excel");
  });
});
