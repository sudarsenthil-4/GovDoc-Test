// Shared ExcelJS styling tokens + helpers for rubric exports.
// All three rubric workbooks (CMGC, CUCP, ROW) wire these in the same order,
// so the .xlsx files end up visually consistent.

import type { Worksheet } from "exceljs";

export const TOKENS = {
  fontHeader: { name: "Calibri", bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
  fontTitle: { name: "Calibri", bold: true, color: { argb: "FF1F1F1F" }, size: 14 },
  fontSubtitle: { name: "Calibri", color: { argb: "FF5C5550" }, size: 10, italic: true },
  fontBody: { name: "Calibri", color: { argb: "FF1F1F1F" }, size: 11 },
  fillHeader: {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFB04A2D" },
  },
  fillStripe: {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFFBF6F0" },
  },
  fillTitle: {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFF5EDE2" },
  },
  borderThin: { style: "thin" as const, color: { argb: "FFE3D9C8" } },
} as const;

export type ColumnSpec = {
  width: number;
  wrap?: boolean;
};

export function applyTitleBlock(
  sheet: Worksheet,
  args: { title: string; subtitle: string; columnCount: number },
): void {
  const { title, subtitle, columnCount } = args;
  sheet.mergeCells(1, 1, 1, columnCount);
  sheet.mergeCells(2, 1, 2, columnCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = TOKENS.fontTitle;
  titleCell.fill = TOKENS.fillTitle;
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(1).height = 26;
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = TOKENS.fontSubtitle;
  subtitleCell.fill = TOKENS.fillTitle;
  subtitleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(2).height = 18;
  // Row 3 left blank as spacer.
}

export function applyHeaderBand(
  sheet: Worksheet,
  args: { row: number; columnCount: number },
): void {
  const { row, columnCount } = args;
  const r = sheet.getRow(row);
  for (let c = 1; c <= columnCount; c++) {
    const cell = r.getCell(c);
    cell.font = TOKENS.fontHeader;
    cell.fill = TOKENS.fillHeader;
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = { bottom: TOKENS.borderThin };
  }
  r.height = 22;
}

export function applyStripes(
  sheet: Worksheet,
  args: { firstDataRow: number; lastDataRow: number; columnCount: number },
): void {
  const { firstDataRow, lastDataRow, columnCount } = args;
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    const stripe = (r - firstDataRow) % 2 === 1;
    const row = sheet.getRow(r);
    for (let c = 1; c <= columnCount; c++) {
      const cell = row.getCell(c);
      cell.font = TOKENS.fontBody;
      cell.alignment = { wrapText: true, vertical: "top" };
      if (stripe) cell.fill = TOKENS.fillStripe;
      cell.border = {
        top: TOKENS.borderThin,
        bottom: TOKENS.borderThin,
        left: TOKENS.borderThin,
        right: TOKENS.borderThin,
      };
    }
  }
}

export function setupColumns(sheet: Worksheet, columns: ColumnSpec[]): void {
  columns.forEach((c, i) => {
    const col = sheet.getColumn(i + 1);
    col.width = c.width;
  });
}

export function freezeBelow(sheet: Worksheet, row: number): void {
  sheet.views = [{ state: "frozen", ySplit: row, xSplit: 0 }];
}

export function addAutofilter(
  sheet: Worksheet,
  args: { fromRow: number; toRow: number; columnCount: number },
): void {
  const { fromRow, toRow, columnCount } = args;
  sheet.autoFilter = {
    from: { row: fromRow, column: 1 },
    to: { row: toRow, column: columnCount },
  };
}
