import ExcelJS from "exceljs";
import type { CucpRubricData } from "../rubric-data";
import {
  applyTitleBlock,
  applyHeaderBand,
  applyStripes,
  setupColumns,
  freezeBelow,
  addAutofilter,
} from "../../shared/rubric-xlsx-style";

export async function buildCucpRubricXlsx(data: CucpRubricData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Criteria");
  const headers = ["S/No", "Type", "Name", "Rule", "YES (Pass)", "NO (Fail)"];
  applyTitleBlock(sheet, {
    title: "Validate Narrative Rubric",
    subtitle: `Exported ${new Date().toISOString().slice(0, 10)} · CUCP §26.67 SED Narrative + PNW`,
    columnCount: headers.length,
  });
  const headerRow = 4;
  sheet.getRow(headerRow).values = headers;
  applyHeaderBand(sheet, { row: headerRow, columnCount: headers.length });

  const sorted = [...data.l3].sort((a, b) => a.s_no - b.s_no);
  sorted.forEach((c, i) => {
    sheet.getRow(headerRow + 1 + i).values = [
      c.s_no,
      c.s_no <= 3 ? "Mandatory" : "Scored",
      c.title ?? c.name,
      c.rule ?? "—",
      c.pass ?? "—",
      c.fail ?? "—",
    ];
  });
  const lastRow = headerRow + sorted.length;
  applyStripes(sheet, {
    firstDataRow: headerRow + 1,
    lastDataRow: lastRow,
    columnCount: headers.length,
  });
  setupColumns(sheet, [
    { width: 8 },
    { width: 14 },
    { width: 32 },
    { width: 38 },
    { width: 38 },
    { width: 38 },
  ]);
  freezeBelow(sheet, headerRow);
  if (sorted.length > 0) {
    addAutofilter(sheet, {
      fromRow: headerRow,
      toRow: lastRow,
      columnCount: headers.length,
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
