import type { UseCase } from "../types";
import { extractStep } from "./pipeline/extract-step";
import { level1Step } from "./pipeline/level-1-step";
import { level2Step } from "./pipeline/level-2-step";
import { level3Step } from "./pipeline/level-3-step";
import { reportStep } from "./pipeline/report-step";
import { xlsxExporter } from "./exporters/xlsx";
import { docxExporter } from "./exporters/docx";
import { jsonExporter } from "./exporters/json";

export const cucpReevals: UseCase = {
  id: "cucp-reevals",
  label: "Validate Narrative",
  blurb: "Three-pass DBE re-eligibility review (W5 audit → fact extraction → §26.67 thresholds) with a human override gate.",
  tile: "review",
  inputs: [
    {
      kind: "file", id: "narrative",
      label: "Personal Narrative Statement (PDF)",
      accept: [".pdf"],
      required: true,
    },
    {
      kind: "file", id: "revenues",
      label: "Firm revenues spreadsheet (XLSX, optional)",
      accept: [".xlsx"],
    },
    {
      kind: "model-pick", id: "model",
      label: "AI provider",
      providers: ["openai", "anthropic", "groq"],
    },
  ],
  pipeline: [extractStep, level1Step, level2Step, level3Step, reportStep],
  exporters: [xlsxExporter, docxExporter, jsonExporter],
  resultView: { kind: "pass-fail-criteria" },
};
