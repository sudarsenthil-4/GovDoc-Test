import ExcelJS from "exceljs";

export type FirmRevenues = Record<string, { revenue?: number; pnw?: number }>;

export async function parseFirmRevenuesFromXlsx(buffer: Buffer): Promise<FirmRevenues> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return {};

  let firmCol = 1;
  let revenueCol = 2;
  let pnwCol = -1;
  const header = ws.getRow(1);
  header.eachCell((cell, col) => {
    const v = String(cell.value ?? "").toLowerCase();
    if (v.includes("firm")) firmCol = col;
    else if (v.includes("revenue")) revenueCol = col;
    else if (v === "pnw" || v.includes("net worth")) pnwCol = col;
  });

  const out: FirmRevenues = {};
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const name = String(row.getCell(firmCol).value ?? "").trim();
    if (!name) continue;
    const revenue = Number(row.getCell(revenueCol).value);
    const pnw = pnwCol > 0 ? Number(row.getCell(pnwCol).value) : NaN;
    out[name] = {
      revenue: Number.isFinite(revenue) ? revenue : undefined,
      pnw: Number.isFinite(pnw) ? pnw : undefined,
    };
  }
  return out;
}
