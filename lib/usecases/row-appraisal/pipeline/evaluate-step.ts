import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";
import { orderCategoriesByDependencyGroups } from "@/lib/usecases/row-appraisal/chunking/group-categories";
import { runOneChunk } from "@/lib/usecases/row-appraisal/chunking/run-chunk";
import type { ChunkRubric } from "@/lib/usecases/row-appraisal/rules/prompt-builder";
import rubricSchema from "@/lib/usecases/row-appraisal/assets/rubric_schema.json";
import { applyVisionFallback } from "@/lib/usecases/row-appraisal/vision/apply-vision-fallback";

const CHUNK_SIZE = 8;

type ExtractPrior = {
  extracted_text: string;
  pdf_bytes_b64?: string;
};

export const evaluateStep: PipelineStep<unknown> = {
  id: "evaluate",
  label: "Chunked LLM evaluation",
  async *run(_input, ctx) {
    const prior = (ctx.prior.extract ?? {}) as ExtractPrior;
    const extractedText = prior.extracted_text ?? "";
    const provider: LlmProvider = "openai";
    const model = "gpt-4.1";

    // Read the rubric chosen for this run; fall back to the bundled default
    // for older callers (StepContext literals in tests, legacy callers).
    const runtimeRubric = ctx.rubric as Record<string, Record<string, string>> | undefined;
    const isValidRubric =
      runtimeRubric &&
      typeof runtimeRubric === "object" &&
      !Array.isArray(runtimeRubric) &&
      Object.values(runtimeRubric).every(
        (v) => v && typeof v === "object" && !Array.isArray(v),
      );
    const effectiveRubric = isValidRubric
      ? runtimeRubric
      : (rubricSchema as Record<string, Record<string, string>>);
    const ordered = orderCategoriesByDependencyGroups(effectiveRubric);
    const total = Math.ceil(ordered.length / CHUNK_SIZE);

    const allResults: EvaluationResult[] = [];

    for (let i = 0; i < total; i++) {
      const chunkSlice = ordered.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkRubric: ChunkRubric = Object.fromEntries(
        chunkSlice.map(({ category, rubric }) => [category, rubric]),
      );

      yield {
        type: "progress",
        stage: "evaluate",
        pct: (i / total) * 100,
        message: `Evaluating chunk ${i + 1}/${total}: ${chunkSlice.map((s) => s.category).join(", ")}`,
      } satisfies StepEvent;

      const chunkResults = await runOneChunk({
        chunkRubric,
        extractedText,
        llm: ctx.llm,
        provider,
        model,
      });

      allResults.push(...chunkResults);

      yield {
        type: "partial",
        stage: "evaluate",
        data: { chunkIndex: i, results: chunkResults },
      } satisfies StepEvent;
    }

    const pdfB64 = prior.pdf_bytes_b64;
    let finalResults = allResults;
    if (pdfB64) {
      yield {
        type: "progress",
        stage: "evaluate",
        pct: 95,
        message: "Running vision fallback for map categories",
      } satisfies StepEvent;
      const pdfBytes = Buffer.from(pdfB64, "base64");
      finalResults = await applyVisionFallback(allResults, pdfBytes, ctx.llm);
    }

    yield {
      type: "stage-done",
      stage: "evaluate",
      data: { raw_results: finalResults },
    } satisfies StepEvent;
  },
};
