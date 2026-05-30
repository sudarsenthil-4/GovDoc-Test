import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildRowRubricXlsx } from "./rubric-xlsx";
import { defaultRowRubric } from "../rubric-data";
import { TOKENS } from "../../shared/rubric-xlsx-style";

describe("buildRowRubricXlsx", () => {
  it("produces a workbook with a single Categories sheet", async () => {
    const buf = await buildRowRubricXlsx(defaultRowRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const names = wb.worksheets.map((w) => w.name);
    expect(names).toEqual(["Categories"]);
  });

  it("writes the rubric title in row 1", async () => {
    const buf = await buildRowRubricXlsx(defaultRowRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("Categories");
    expect(sheet?.getCell(1, 1).value).toBe("Validate Appraisal Rubric");
  });

  it("writes the expected header row and one data row per category", async () => {
    const data = defaultRowRubric();
    const buf = await buildRowRubricXlsx(data);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("Categories")!;
    const headerRow = sheet.getRow(4);
    const headerValues = (headerRow.values as (string | undefined)[]).slice(1);
    expect(headerValues[0]).toBe("Category");
    expect(headerValues).toHaveLength(6);
    expect(String(headerValues[1] ?? "")).toContain("Tier 1");
    expect(String(headerValues[5] ?? "")).toContain("Tier 5");

    const categories = Object.entries(data);
    const lastDataRow = sheet.getRow(4 + categories.length);
    expect(String(lastDataRow.getCell(1).value ?? "")).toBe(
      categories[categories.length - 1]![0],
    );
  });

  it("applies the branded header fill on the header row", async () => {
    const buf = await buildRowRubricXlsx(defaultRowRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const cell = wb.getWorksheet("Categories")!.getCell(4, 1);
    const fill = cell.fill as { fgColor?: { argb?: string } } | undefined;
    expect(fill?.fgColor?.argb).toBe(TOKENS.fillHeader.fgColor.argb);
  });
});
