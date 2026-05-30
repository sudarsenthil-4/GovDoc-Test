import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildCucpRubricXlsx } from "./rubric-xlsx";
import { defaultCucpRubric } from "../rubric-data";
import { TOKENS } from "../../shared/rubric-xlsx-style";

describe("buildCucpRubricXlsx", () => {
  it("produces a workbook with a single Criteria sheet", async () => {
    const buf = await buildCucpRubricXlsx(defaultCucpRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const names = wb.worksheets.map((w) => w.name);
    expect(names).toEqual(["Criteria"]);
  });

  it("writes the rubric title in row 1", async () => {
    const buf = await buildCucpRubricXlsx(defaultCucpRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("Criteria");
    expect(sheet?.getCell(1, 1).value).toBe("Validate Narrative Rubric");
  });

  it("writes the expected header row and one data row per criterion", async () => {
    const data = defaultCucpRubric();
    const buf = await buildCucpRubricXlsx(data);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("Criteria")!;
    const headerRow = sheet.getRow(4);
    const headerValues = (headerRow.values as (string | undefined)[]).slice(1);
    expect(headerValues).toEqual([
      "S/No",
      "Type",
      "Name",
      "Rule",
      "YES (Pass)",
      "NO (Fail)",
    ]);
    const lastDataRow = sheet.getRow(4 + data.l3.length);
    expect(lastDataRow.getCell(1).value).toBe(data.l3[data.l3.length - 1]!.s_no);
  });

  it("labels s_no <= 3 as Mandatory and the rest as Scored", async () => {
    const data = defaultCucpRubric();
    const buf = await buildCucpRubricXlsx(data);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("Criteria")!;
    const mandatory = sheet.getRow(5);
    expect(mandatory.getCell(2).value).toBe("Mandatory");
    const scored = sheet.getRow(8);
    expect(scored.getCell(2).value).toBe("Scored");
  });

  it("applies the branded header fill on the header row", async () => {
    const buf = await buildCucpRubricXlsx(defaultCucpRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const cell = wb.getWorksheet("Criteria")!.getCell(4, 1);
    const fill = cell.fill as { fgColor?: { argb?: string } } | undefined;
    expect(fill?.fgColor?.argb).toBe(TOKENS.fillHeader.fgColor.argb);
  });
});
