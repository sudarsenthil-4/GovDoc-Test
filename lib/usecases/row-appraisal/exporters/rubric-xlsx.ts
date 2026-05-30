import ExcelJS from "exceljs";
import type { RowRubricData } from "../rubric-data";
import {
  applyTitleBlock,
  applyHeaderBand,
  applyStripes,
  setupColumns,
  freezeBelow,
  addAutofilter,
} from "../../shared/rubric-xlsx-style";

export async function buildRowRubricXlsx(data: RowRubricData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Categories");
  const headers = [
    "Category",
    "Tier 1 — Unacceptable",
    "Tier 2 — Poor",
    "Tier 3 — Acceptable",
    "Tier 4 — Good",
    "Tier 5 — Excellent",
  ];
  applyTitleBlock(sheet, {
    title: "Validate Appraisal Rubric",
    subtitle: `Exported ${new Date().toISOString().slice(0, 10)} · Caltrans ROW Appraisal`,
    columnCount: headers.length,
  });
  const headerRow = 4;
  sheet.getRow(headerRow).values = headers;
  applyHeaderBand(sheet, { row: headerRow, columnCount: headers.length });

  const categories = Object.entries(data);
  categories.forEach(([name, tiers], i) => {
    sheet.getRow(headerRow + 1 + i).values = [
      name,
      tiers["1"] || "—",
      tiers["2"] || "—",
      tiers["3"] || "—",
      tiers["4"] || "—",
      tiers["5"] || "—",
    ];
  });
  const lastRow = headerRow + categories.length;
  applyStripes(sheet, {
    firstDataRow: headerRow + 1,
    lastDataRow: lastRow,
    columnCount: headers.length,
  });
  setupColumns(sheet, [
    { width: 36 },
    { width: 38 },
    { width: 38 },
    { width: 38 },
    { width: 38 },
    { width: 38 },
  ]);
  freezeBelow(sheet, headerRow);
  if (categories.length > 0) {
    addAutofilter(sheet, {
      fromRow: headerRow,
      toRow: lastRow,
      columnCount: headers.length,
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
