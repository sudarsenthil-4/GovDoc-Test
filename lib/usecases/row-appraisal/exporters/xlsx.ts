import ExcelJS from "exceljs";
import type { Exporter } from "@/lib/usecases/types";
import type { RowRunResult } from "@/lib/usecases/row-appraisal/types";

export async function buildEvaluationXlsx(result: RowRunResult): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ROW Evaluation");

  ws.columns = [
    { header: "Category", key: "category", width: 25 },
    { header: "Score", key: "score", width: 8 },
    { header: "Criteria Met", key: "criteria_met", width: 50 },
    { header: "Evidence", key: "evidence", width: 50 },
    { header: "Status", key: "status", width: 12 },
    { header: "Comments", key: "comments", width: 40 },
  ];

  ws.getRow(1).font = { bold: true };

  for (const r of result.evaluation_results) {
    ws.addRow({
      category: r.category,
      score: r.score === -1 ? "N/A" : r.score,
      criteria_met: r.criteria_met,
      evidence: r.evidence,
      status: r.status,
      comments: r.comments,
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export const xlsxExporter: Exporter = {
  id: "xlsx",
  label: "Download as Excel",
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  build: async (result) => {
    const buf = await buildEvaluationXlsx(result as RowRunResult);
    return new Uint8Array(buf);
  },
};
