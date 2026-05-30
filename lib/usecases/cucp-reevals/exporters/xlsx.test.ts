import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { xlsxExporter } from "./xlsx";
import type { Level1Data, Level2Data, Level3Data, Criterion } from "@/lib/usecases/cucp-reevals/types";

const seven = (): Criterion[] =>
  Array.from({ length: 7 }, (_, i) => ({
    s_no: i + 1,
    category: `Cat ${i + 1}`,
    qualification: `Q ${i + 1}`,
    rule_requires: "rule",
    evidence_summary: "ev",
    reasoning: "r",
    pass_fail: "Pass" as const,
    request_info: "No" as const,
    confidence: 9.5,
  }));

const sample = {
  level1: {
    firm_name: "Acme",
    cross_reference_result: "FAILED",
    narrative_pnw: "NOT PROVIDED",
    extracted_facts: [
      {
        id: "fact_1",
        when: "2025",
        where: "CA",
        who: "Owner",
        what: "lost contract",
        why: "discrim",
        magnitude: "$50k",
        demographic_flag: true,
        source_quote: "...",
      },
      {
        id: "fact_2",
        when: "2024",
        where: "NV",
        who: "Partner",
        what: "denied loan",
        why: "bias",
        magnitude: "$200k",
        demographic_flag: false,
        source_quote: "...",
      },
    ],
  } as Level1Data,
  level2: { classifications: [] } as Level2Data,
  level3: { criteria: seven(), final_decision: "Yes" as const, certifier_comments: "ok" } as Level3Data,
  overrides: [],
};

describe("xlsxExporter (CUCP)", () => {
  it("produces a workbook with the three named sheets", async () => {
    const bytes = await xlsxExporter.build(sample);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    );
    const names = wb.worksheets.map((w) => w.name);
    expect(names).toEqual(["Decision Summary", "Reasoning", "Facts"]);
  });

  it("Decision Summary sheet has 9 rows (header + 7 criteria + final row)", async () => {
    const bytes = await xlsxExporter.build(sample);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    );
    const ws = wb.getWorksheet("Decision Summary")!;
    expect(ws.rowCount).toBe(9);
    expect(ws.getRow(9).getCell(1).value).toBe(8);
  });

  it("Reasoning sheet has 8 rows (header + 7 criteria; no row 8 here)", async () => {
    const bytes = await xlsxExporter.build(sample);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    );
    expect(wb.getWorksheet("Reasoning")!.rowCount).toBe(8);
  });

  it("Facts sheet has one row per extracted fact + header", async () => {
    const bytes = await xlsxExporter.build(sample);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    );
    expect(wb.getWorksheet("Facts")!.rowCount).toBe(3); // header + 2 facts
  });

  it("applies analyst_overrides before rendering Decision Summary", async () => {
    const overridden = {
      ...sample,
      overrides: [{ s_no: 3, field: "pass_fail" as const, value: "Fail", reasoning: "x" }],
    };
    const bytes = await xlsxExporter.build(overridden);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    );
    const ws = wb.getWorksheet("Decision Summary")!;
    // Row index for s_no 3 is row 4 (header at 1, criteria at 2..8)
    const row3 = ws.getRow(4);
    // Pass column is 4, Fail column is 5
    expect(row3.getCell(4).value).toBe("No");
    expect(row3.getCell(5).value).toBe("Yes");
    // Final decision row (row 9) reflects overall failure: Pass=No, Fail=Yes
    const finalRow = ws.getRow(9);
    expect(finalRow.getCell(4).value).toBe("No");
    expect(finalRow.getCell(5).value).toBe("Yes");
  });

  it("exposes the canonical Exporter contract fields", () => {
    expect(xlsxExporter.id).toBe("xlsx");
    expect(xlsxExporter.contentType).toContain("spreadsheetml");
  });
});
