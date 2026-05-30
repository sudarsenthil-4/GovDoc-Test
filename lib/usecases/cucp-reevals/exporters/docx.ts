import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { Exporter } from "@/lib/usecases/types";
import type { Level1Data, Level2Data, Level3Data, AnalystOverride } from "@/lib/usecases/cucp-reevals/types";
import { applyOverridesToLevel3 } from "@/lib/usecases/cucp-reevals/report/markdown";

type Bundle = {
  level1: Level1Data;
  level2: Level2Data;
  level3: Level3Data;
  overrides?: AnalystOverride[];
};

export async function buildCucpDocx(bundle: Bundle): Promise<Buffer> {
  const adjusted = applyOverridesToLevel3(bundle.level3, bundle.overrides ?? []);
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(`CUCP Re-Evaluation — ${bundle.level1.firm_name || "Unknown Firm"}`)],
    }),
  );

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Pre-Scoring Audit (W5)")],
    }),
  );
  children.push(new Paragraph(`Cross-Reference Result: ${bundle.level1.cross_reference_result}`));
  children.push(new Paragraph(`Narrative PNW: ${bundle.level1.narrative_pnw}`));
  children.push(new Paragraph(`Facts captured: ${bundle.level1.extracted_facts.length}`));

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Decision Summary")],
    }),
  );
  children.push(new Paragraph(`Final Decision: ${adjusted.final_decision}`));
  for (const c of adjusted.criteria) {
    children.push(
      new Paragraph(
        `${c.s_no}. ${c.category} — ${c.qualification}: ${c.pass_fail} (Req Info: ${c.request_info}, Conf: ${Number.isFinite(c.confidence) ? c.confidence.toFixed(1) : "10.0"})`,
      ),
    );
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Reasoning")],
    }),
  );
  for (const c of adjusted.criteria) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun(`${c.s_no}. ${c.category}`)],
      }),
    );
    children.push(new Paragraph(`Rule requires: ${c.rule_requires}`));
    children.push(new Paragraph(`Evidence: ${c.evidence_summary}`));
    children.push(new Paragraph(`Reasoning: ${c.reasoning}`));
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Certifier Comments")],
    }),
  );
  children.push(new Paragraph(adjusted.certifier_comments || "—"));

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export const docxExporter: Exporter = {
  id: "docx",
  label: "Download DOCX report",
  contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  async build(result: unknown): Promise<Uint8Array> {
    const buf = await buildCucpDocx(result as Bundle);
    return new Uint8Array(buf);
  },
};
