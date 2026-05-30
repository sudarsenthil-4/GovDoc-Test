import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } from "docx";
import type { Exporter } from "@/lib/usecases/types";
import type { RowRunResult } from "@/lib/usecases/row-appraisal/types";

const HEADERS = ["Category", "Score", "Criteria Met", "Evidence", "Status", "Comments"];

function headerRow(): TableRow {
  return new TableRow({
    children: HEADERS.map(
      (h) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
        }),
    ),
  });
}

export async function buildEvaluationDocx(result: RowRunResult): Promise<Buffer> {
  const dataRows = result.evaluation_results.map((r) =>
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(r.category)] }),
        new TableCell({ children: [new Paragraph(r.score === -1 ? "N/A" : String(r.score))] }),
        new TableCell({ children: [new Paragraph(r.criteria_met)] }),
        new TableCell({ children: [new Paragraph(r.evidence)] }),
        new TableCell({ children: [new Paragraph(r.status)] }),
        new TableCell({ children: [new Paragraph(r.comments)] }),
      ],
    }),
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow(), ...dataRows],
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun(`Validate Appraisal`)],
          }),
          new Paragraph(`Evaluated: ${result.evaluation_date}`),
          table,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export const docxExporter: Exporter = {
  id: "docx",
  label: "Download as Word",
  contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  build: async (result) => {
    const buf = await buildEvaluationDocx(result as RowRunResult);
    return new Uint8Array(buf);
  },
};
