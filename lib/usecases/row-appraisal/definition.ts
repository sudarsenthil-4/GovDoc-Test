import type { UseCase } from "../types";
import { extractStep } from "./pipeline/extract-step";
import { evaluateStep } from "./pipeline/evaluate-step";
import { consolidateStep } from "./pipeline/consolidate-step";
import { xlsxExporter } from "./exporters/xlsx";
import { docxExporter } from "./exporters/docx";

export const rowAppraisal: UseCase = {
  id: "row-appraisal",
  label: "Validate Appraisal",
  blurb: "Score Caltrans appraisal reports against the 34-category rubric.",
  tile: "review",
  inputs: [
    { kind: "file", id: "pdf", label: "Appraisal PDF", accept: [".pdf"], required: true },
    { kind: "model-pick", id: "model", label: "AI provider", providers: ["openai", "anthropic", "groq"] },
  ],
  pipeline: [extractStep, evaluateStep, consolidateStep],
  exporters: [xlsxExporter, docxExporter],
  resultView: { kind: "score-table" },
};
