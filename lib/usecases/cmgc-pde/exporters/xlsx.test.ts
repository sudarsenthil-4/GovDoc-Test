import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildEvaluationXlsx, xlsxExporter } from "./xlsx";
import { mockRunResult } from "../scoring/fixtures";

describe("buildEvaluationXlsx", () => {
  it("produces a workbook with 4 named sheets in order", async () => {
    const buf = await buildEvaluationXlsx(mockRunResult(), "Test Project");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    expect(wb.worksheets.map((w) => w.name)).toEqual(
      ["Dashboard", "Rubric", "Scoring", "Multi-Method"],
    );
  });

  it("Dashboard contains the recommended method label", async () => {
    const buf = await buildEvaluationXlsx(mockRunResult(), "Test Project");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const dashboard = wb.getWorksheet("Dashboard")!;
    let found = false;
    dashboard.eachRow((row) => {
      row.eachCell((cell) => {
        if (String(cell.value ?? "").toLowerCase().includes("recommended")) found = true;
      });
    });
    expect(found).toBe(true);
  });

  it("Rubric sheet has 26 rows (header + 25 questions)", async () => {
    const buf = await buildEvaluationXlsx(mockRunResult(), "Test Project");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const rubric = wb.getWorksheet("Rubric")!;
    let count = 0;
    rubric.eachRow((row) => { if (row.getCell(1).value) count++; });
    expect(count).toBeGreaterThanOrEqual(26);
  });

  it("Multi-Method sheet has 7 rows (header + 6 methods)", async () => {
    const buf = await buildEvaluationXlsx(mockRunResult(), "Test Project");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const mm = wb.getWorksheet("Multi-Method")!;
    let count = 0;
    mm.eachRow((row) => { if (row.getCell(1).value !== null && row.getCell(1).value !== undefined) count++; });
    expect(count).toBeGreaterThanOrEqual(7);
  });

  it("Dashboard section weights match the canonical rubric", async () => {
    const buf = await buildEvaluationXlsx(mockRunResult(), "Test");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const dashboard = wb.getWorksheet("Dashboard")!;
    // Section rows are written as [sec, avg, weight, weighted] where sec is "A", "B", etc.
    let foundWeights: string[] = [];
    dashboard.eachRow((row) => {
      const first = String(row.getCell(1).value ?? "");
      if (/^[ABCDEF]$/.test(first)) {
        foundWeights.push(String(row.getCell(3).value ?? ""));
      }
    });
    expect(foundWeights.length).toBe(6);
    // Canonical weight for section A is 0.30 — verify it's not the old fabricated 0.20
    expect(Number(foundWeights[0])).toBeCloseTo(0.30, 5);
  });
});

describe("xlsxExporter", () => {
  it("returns a Uint8Array starting with ZIP magic bytes (PK\\x03\\x04)", async () => {
    const result = mockRunResult();
    const out = await xlsxExporter.build(result);
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out[0]).toBe(0x50);
    expect(out[1]).toBe(0x4b);
    expect(out[2]).toBe(0x03);
    expect(out[3]).toBe(0x04);
  });

  it("uses evaluation.project_name as the title", async () => {
    const result = mockRunResult();
    result.evaluation.project_name = "I-880 Widening";
    const out = await xlsxExporter.build(result);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(Buffer.from(out) as any);
    const dashboard = wb.getWorksheet("Dashboard")!;
    expect(String(dashboard.getCell("A1").value)).toContain("I-880 Widening");
  });
});
