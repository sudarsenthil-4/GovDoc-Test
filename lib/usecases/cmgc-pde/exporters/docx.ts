import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { Exporter } from "@/lib/usecases/types";
import type { CmgcRunResult } from "../types";

export async function buildEvaluationDocx(result: CmgcRunResult, projectName: string): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Title page
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(`Project Delivery Evaluation — ${projectName}`)],
    }),
  );
  children.push(
    new Paragraph({
      children: [new TextRun(`Evaluation date: ${result.evaluation.evaluation_date}`)],
    }),
  );

  // Recommendation summary
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(`Recommended: ${result.recommendation.recommended_method}`)],
    }),
  );
  children.push(new Paragraph(`Composite score: ${result.recommendation.composite_score.toFixed(3)} / 3.000`));
  children.push(new Paragraph(`Runner-up: ${result.recommendation.runner_up_method ?? "—"}`));
  children.push(new Paragraph(`Borderline: ${result.recommendation.is_borderline ? "Yes" : "No"}`));

  // Override reasons
  if (result.recommendation.override_reasons.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Override Reasons")],
      }),
    );
    for (const reason of result.recommendation.override_reasons) {
      children.push(new Paragraph({ children: [new TextRun(`• ${reason}`)] }));
    }
  }

  // Section breakdown
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("Section Scores")],
    }),
  );
  for (const [sec, score] of Object.entries(result.recommendation.section_scores)) {
    children.push(new Paragraph(`${sec}: ${(score as number).toFixed(2)} / 3.00`));
  }

  // Top 3 methods
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("Top 3 Methods")],
    }),
  );
  for (const m of result.multi_method.method_scores.slice(0, 3)) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [
          new TextRun(
            `${m.rank}. ${m.method} (score ${m.score.toFixed(4)}${m.blocked ? ", BLOCKED" : ""})`,
          ),
        ],
      }),
    );
    if (m.pros.length > 0) children.push(new Paragraph(`Pros: ${m.pros.join("; ")}`));
    if (m.cons.length > 0) children.push(new Paragraph(`Cons: ${m.cons.join("; ")}`));
  }

  // Rubric ratings
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("Rubric Ratings")],
    }),
  );
  for (const r of result.evaluation.ratings) {
    children.push(
      new Paragraph(`[${r.question_id}] ${r.selected_rating || "—"} (conf ${r.confidence.toFixed(2)})`),
    );
    if (r.source_reasoning) {
      children.push(new Paragraph(`  ${r.source_reasoning.slice(0, 400)}`));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export const docxExporter: Exporter = {
  id: "docx",
  label: "Download DOCX report",
  contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  async build(result: unknown): Promise<Uint8Array> {
    const r = result as CmgcRunResult;
    const projectName = r.evaluation.project_name || "Untitled Project";
    const buf = await buildEvaluationDocx(r, projectName);
    return new Uint8Array(buf);
  },
};
