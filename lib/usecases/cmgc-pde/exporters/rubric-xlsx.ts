import ExcelJS from "exceljs";
import type { CmgcRubricData } from "../rubric-data";
import {
  applyTitleBlock,
  applyHeaderBand,
  applyStripes,
  setupColumns,
  freezeBelow,
  addAutofilter,
} from "../../shared/rubric-xlsx-style";

const TODAY = () => new Date().toISOString().slice(0, 10);

export async function buildCmgcRubricXlsx(data: CmgcRubricData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const subtitle = `Exported ${TODAY()} · CMGC Project Delivery Evaluation`;

  // -------- Sheet 1: Questions --------
  const questions = wb.addWorksheet("Questions");
  const qHeaders = ["ID", "Section", "Question", "Option A", "Option B", "Option C"];
  applyTitleBlock(questions, {
    title: "Validate Project Rubric",
    subtitle,
    columnCount: qHeaders.length,
  });
  const qHeaderRow = 4;
  questions.getRow(qHeaderRow).values = qHeaders;
  applyHeaderBand(questions, { row: qHeaderRow, columnCount: qHeaders.length });
  data.questions.forEach((q, i) => {
    questions.getRow(qHeaderRow + 1 + i).values = [
      q.id,
      q.section,
      q.question,
      q.option_a,
      q.option_b,
      q.option_c,
    ];
  });
  const qLastRow = qHeaderRow + data.questions.length;
  applyStripes(questions, {
    firstDataRow: qHeaderRow + 1,
    lastDataRow: qLastRow,
    columnCount: qHeaders.length,
  });
  setupColumns(questions, [
    { width: 8 },
    { width: 28 },
    { width: 48 },
    { width: 38 },
    { width: 38 },
    { width: 38 },
  ]);
  freezeBelow(questions, qHeaderRow);
  if (data.questions.length > 0) {
    addAutofilter(questions, {
      fromRow: qHeaderRow,
      toRow: qLastRow,
      columnCount: qHeaders.length,
    });
  }

  // -------- Sheet 2: Section Weights --------
  const weights = wb.addWorksheet("Section Weights");
  const wHeaders = ["Section", "Weight", "Weight %"];
  applyTitleBlock(weights, {
    title: "Section Weights",
    subtitle,
    columnCount: wHeaders.length,
  });
  const wHeaderRow = 4;
  weights.getRow(wHeaderRow).values = wHeaders;
  applyHeaderBand(weights, { row: wHeaderRow, columnCount: wHeaders.length });
  const sectionKeys = (Object.keys(data.weights) as Array<keyof typeof data.weights>).sort();
  sectionKeys.forEach((k, i) => {
    const w = data.weights[k];
    weights.getRow(wHeaderRow + 1 + i).values = [k, w, `${Math.round(w * 100)}%`];
  });
  const wLastRow = wHeaderRow + sectionKeys.length;
  applyStripes(weights, {
    firstDataRow: wHeaderRow + 1,
    lastDataRow: wLastRow,
    columnCount: wHeaders.length,
  });
  setupColumns(weights, [{ width: 14 }, { width: 14 }, { width: 14 }]);
  freezeBelow(weights, wHeaderRow);
  if (sectionKeys.length > 0) {
    addAutofilter(weights, {
      fromRow: wHeaderRow,
      toRow: wLastRow,
      columnCount: wHeaders.length,
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
