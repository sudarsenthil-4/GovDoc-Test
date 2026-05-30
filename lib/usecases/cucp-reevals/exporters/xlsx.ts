import ExcelJS from "exceljs";
import type { Exporter } from "@/lib/usecases/types";
import type { Level1Data, Level2Data, Level3Data, AnalystOverride } from "@/lib/usecases/cucp-reevals/types";
import { applyOverridesToLevel3 } from "@/lib/usecases/cucp-reevals/report/markdown";

type Bundle = {
  level1: Level1Data;
  level2: Level2Data;
  level3: Level3Data;
  overrides?: AnalystOverride[];
};

export async function buildCucpXlsx(bundle: Bundle): Promise<Buffer> {
  const adjusted = applyOverridesToLevel3(bundle.level3, bundle.overrides ?? []);
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Decision Summary
  const ds = wb.addWorksheet("Decision Summary");
  ds.getRow(1).values = [
    "S. No",
    "Category",
    "Qualification",
    "Pass",
    "Fail",
    "Request Info",
    "Confidence",
    "Eligible",
  ];
  ds.getRow(1).font = { bold: true };

  let overallFail = false;
  adjusted.criteria.forEach((c, i) => {
    const isPass = c.pass_fail === "Pass" ? "Yes" : "No";
    const isFail = c.pass_fail === "Fail" ? "Yes" : "No";
    if (isFail === "Yes") overallFail = true;
    const conf = Number.isFinite(c.confidence) ? Number(c.confidence).toFixed(1) : "10.0";
    ds.getRow(i + 2).values = [
      c.s_no,
      c.category,
      c.qualification,
      isPass,
      isFail,
      c.request_info,
      conf,
      "N/A – criterion-level only",
    ];
  });

  ds.getRow(9).values = [
    8,
    "Final Decision",
    "Meets all SED requirements under §26.67",
    overallFail ? "No" : "Yes",
    overallFail ? "Yes" : "No",
    "No",
    "10.0",
    adjusted.final_decision,
  ];

  // Sheet 2: Reasoning
  const rs = wb.addWorksheet("Reasoning");
  rs.getRow(1).values = [
    "S. No",
    "Category",
    "Qualification",
    "Rule Requires",
    "Evidence Summary",
    "Reasoning",
    "Decision Mapping",
  ];
  rs.getRow(1).font = { bold: true };

  adjusted.criteria.forEach((c, i) => {
    const isPass = c.pass_fail === "Pass" ? "Yes" : "No";
    const isFail = c.pass_fail === "Fail" ? "Yes" : "No";
    const conf = Number.isFinite(c.confidence) ? Number(c.confidence).toFixed(1) : "10.0";
    rs.getRow(i + 2).values = [
      c.s_no,
      c.category,
      c.qualification,
      c.rule_requires,
      c.evidence_summary,
      c.reasoning,
      `Pass = ${isPass}; Fail = ${isFail}; Req Info = ${c.request_info}; Conf = ${conf}`,
    ];
  });

  // Sheet 3: Facts
  const fs = wb.addWorksheet("Facts");
  fs.getRow(1).values = [
    "Fact ID",
    "When",
    "Where",
    "Who",
    "What",
    "Why",
    "Magnitude",
    "Demographic Flag",
    "Source Quote",
  ];
  fs.getRow(1).font = { bold: true };

  (bundle.level1.extracted_facts ?? []).forEach((f, i) => {
    fs.getRow(i + 2).values = [
      f.id,
      f.when,
      f.where,
      f.who,
      f.what,
      f.why,
      f.magnitude,
      f.demographic_flag,
      f.source_quote,
    ];
  });

  for (const ws of wb.worksheets) {
    ws.columns.forEach((col) => {
      col.width = Math.max(col.width ?? 0, 18);
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export const xlsxExporter: Exporter = {
  id: "xlsx",
  label: "Download Excel report",
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  async build(result: unknown): Promise<Uint8Array> {
    const buf = await buildCucpXlsx(result as Bundle);
    return new Uint8Array(buf);
  },
};
