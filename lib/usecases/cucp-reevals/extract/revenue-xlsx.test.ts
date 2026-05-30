import { describe, it, expect, beforeAll } from "vitest";
import ExcelJS from "exceljs";
import { parseFirmRevenuesFromXlsx } from "./revenue-xlsx";

describe("parseFirmRevenuesFromXlsx", () => {
  let validWorkbookBuffer: Buffer;
  let workbookWithoutPnwBuffer: Buffer;
  let emptyWorkbookBuffer: Buffer;

  beforeAll(async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Revenues");
    ws.addRow(["Firm Name", "Revenue", "PNW"]);
    ws.addRow(["Acme Construction LLC", 1500000, 800000]);
    ws.addRow(["Beta Builders Inc", 2200000, 1100000]);
    const ab = await wb.xlsx.writeBuffer();
    validWorkbookBuffer = Buffer.from(ab);

    const wb2 = new ExcelJS.Workbook();
    const ws2 = wb2.addWorksheet("Revenues");
    ws2.addRow(["Firm Name", "Revenue"]);
    ws2.addRow(["Solo Co", 500000]);
    const ab2 = await wb2.xlsx.writeBuffer();
    workbookWithoutPnwBuffer = Buffer.from(ab2);

    const wb3 = new ExcelJS.Workbook();
    wb3.addWorksheet("Empty");
    const ab3 = await wb3.xlsx.writeBuffer();
    emptyWorkbookBuffer = Buffer.from(ab3);
  });

  it("parses firm name + revenue + pnw into a map", async () => {
    const result = await parseFirmRevenuesFromXlsx(validWorkbookBuffer);
    expect(result["Acme Construction LLC"]).toEqual({ revenue: 1500000, pnw: 800000 });
    expect(result["Beta Builders Inc"]).toEqual({ revenue: 2200000, pnw: 1100000 });
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("returns pnw undefined when the column is missing", async () => {
    const result = await parseFirmRevenuesFromXlsx(workbookWithoutPnwBuffer);
    expect(result["Solo Co"]).toEqual({ revenue: 500000, pnw: undefined });
  });

  it("returns {} for an empty workbook", async () => {
    const result = await parseFirmRevenuesFromXlsx(emptyWorkbookBuffer);
    expect(result).toEqual({});
  });

  it("skips rows with empty firm names", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Revenues");
    ws.addRow(["Firm Name", "Revenue"]);
    ws.addRow(["", 99999]);
    ws.addRow(["Real Firm", 100000]);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    const result = await parseFirmRevenuesFromXlsx(buf);
    expect(result).toEqual({ "Real Firm": { revenue: 100000, pnw: undefined } });
  });

  it("matches header detection case-insensitively (e.g. 'firm name', 'revenue')", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("R");
    ws.addRow(["firm name", "revenue", "net worth"]);
    ws.addRow(["LowerCase Co", 250000, 125000]);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    const result = await parseFirmRevenuesFromXlsx(buf);
    expect(result["LowerCase Co"]).toEqual({ revenue: 250000, pnw: 125000 });
  });
});
