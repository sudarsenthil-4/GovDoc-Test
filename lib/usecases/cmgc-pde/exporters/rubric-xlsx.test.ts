import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { buildCmgcRubricXlsx } from "./rubric-xlsx";
import { defaultCmgcRubric } from "../rubric-data";
import { TOKENS } from "../../shared/rubric-xlsx-style";

describe("buildCmgcRubricXlsx", () => {
  it("produces a workbook with Questions and Section Weights sheets", async () => {
    const buf = await buildCmgcRubricXlsx(defaultCmgcRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const names = wb.worksheets.map((w) => w.name);
    expect(names).toEqual(["Questions", "Section Weights"]);
  });

  it("writes a title block in row 1 of the Questions sheet", async () => {
    const buf = await buildCmgcRubricXlsx(defaultCmgcRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("Questions");
    expect(sheet?.getCell(1, 1).value).toBe("Validate Project Rubric");
    expect(String(sheet?.getCell(2, 1).value ?? "")).toContain("CMGC");
  });

  it("writes the expected header row and one data row per question", async () => {
    const data = defaultCmgcRubric();
    const buf = await buildCmgcRubricXlsx(data);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("Questions")!;
    const headerRow = sheet.getRow(4);
    const headerValues = (headerRow.values as (string | undefined)[]).slice(1);
    expect(headerValues).toEqual(["ID", "Section", "Question", "Option A", "Option B", "Option C"]);

    const firstDataRow = sheet.getRow(5);
    expect(firstDataRow.getCell(1).value).toBe(data.questions[0]!.id);
    // Last data row index = 4 (header) + data.questions.length.
    const lastDataRow = sheet.getRow(4 + data.questions.length);
    expect(lastDataRow.getCell(1).value).toBe(data.questions[data.questions.length - 1]!.id);
  });

  it("applies the branded header fill on the header row", async () => {
    const buf = await buildCmgcRubricXlsx(defaultCmgcRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const cell = wb.getWorksheet("Questions")!.getCell(4, 1);
    const fill = cell.fill as { fgColor?: { argb?: string } } | undefined;
    expect(fill?.fgColor?.argb).toBe(TOKENS.fillHeader.fgColor.argb);
  });

  it("writes section weights as decimal + percent text", async () => {
    const buf = await buildCmgcRubricXlsx(defaultCmgcRubric());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("Section Weights")!;
    const firstRow = sheet.getRow(5);
    expect(firstRow.getCell(1).value).toBe("A");
    expect(typeof firstRow.getCell(2).value).toBe("number");
    expect(String(firstRow.getCell(3).value ?? "")).toMatch(/^\d+%$/);
  });
});
