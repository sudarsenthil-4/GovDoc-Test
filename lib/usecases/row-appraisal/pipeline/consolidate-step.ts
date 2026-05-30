import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { EvaluationResult, RowRunResult } from "@/lib/usecases/row-appraisal/types";
import { VALID_CATEGORIES } from "@/lib/usecases/row-appraisal/data/valid-categories";
import { deduplicateResults } from "@/lib/usecases/row-appraisal/parsing/deduplicate";
import { fillMissingCategories } from "@/lib/usecases/row-appraisal/parsing/fill-missing";
import { enforceConsistency } from "@/lib/usecases/row-appraisal/parsing/enforce-consistency";

type EvaluatePrior = { raw_results: EvaluationResult[] };
type ExtractPrior = { pdf_filename: string; markdown_asset: string };

function renderMarkdownTable(results: EvaluationResult[]): string {
  const header = "| Category | Score | Criteria Met | Evidence | Status | Comments |";
  const separator = "|---|---|---|---|---|---|";
  const rows = results.map((r) => {
    const score = r.score === -1 ? "N/A" : String(r.score);
    const escape = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
    return `| ${escape(r.category)} | ${score} | ${escape(r.criteria_met)} | ${escape(r.evidence)} | ${escape(r.status)} | ${escape(r.comments)} |`;
  });
  return [header, separator, ...rows].join("\n");
}

export const consolidateStep: PipelineStep<unknown> = {
  id: "consolidate",
  label: "Consolidate results and render markdown table",
  async *run(_input, ctx) {
    const evaluatePrior = (ctx.prior.evaluate ?? {}) as EvaluatePrior;
    const extractPrior = (ctx.prior.extract ?? {}) as ExtractPrior;

    const rawResults: EvaluationResult[] = evaluatePrior.raw_results ?? [];
    const pdf_filename = extractPrior.pdf_filename ?? "";
    const markdown_asset = extractPrior.markdown_asset ?? "";

    yield { type: "progress", stage: "consolidate", pct: 0 } satisfies StepEvent;

    const deduped = deduplicateResults(rawResults);

    yield { type: "progress", stage: "consolidate", pct: 33 } satisfies StepEvent;

    const filled = fillMissingCategories(deduped, VALID_CATEGORIES.slice() as string[]);

    yield { type: "progress", stage: "consolidate", pct: 66 } satisfies StepEvent;

    const consistent = enforceConsistency(filled);

    // Sort by VALID_CATEGORIES order
    const categoryIndex = new Map<string, number>(VALID_CATEGORIES.map((cat, i) => [cat, i]));
    const sorted = [...consistent].sort(
      (a, b) =>
        (categoryIndex.get(a.category) ?? 9999) -
        (categoryIndex.get(b.category) ?? 9999),
    );

    const markdown_table = renderMarkdownTable(sorted);

    yield { type: "progress", stage: "consolidate", pct: 100 } satisfies StepEvent;

    const result: RowRunResult = {
      pdf_filename,
      markdown_asset,
      evaluation_results: sorted,
      markdown_table,
      evaluation_date: new Date().toISOString(),
    };

    yield {
      type: "stage-done",
      stage: "consolidate",
      data: result,
    } satisfies StepEvent;
  },
};
