import type { LlmRouter, LlmProvider } from "@/lib/llm/types";
import type { EvaluationResult } from "../types";
import type { ChunkRubric } from "../rules/prompt-builder";
import { buildChunkSystemPrompt, buildChunkUserPrompt } from "../rules/prompt-builder";
import { parseChunkResults } from "../parsing/parse-chunk-results";

export async function runOneChunk(args: {
  chunkRubric: ChunkRubric;
  extractedText: string;
  llm: LlmRouter;
  provider: LlmProvider;
  model: string;
}): Promise<EvaluationResult[]> {
  const categoryNames = Object.keys(args.chunkRubric);
  const systemPrompt = buildChunkSystemPrompt(args.chunkRubric);
  const userPrompt = buildChunkUserPrompt(categoryNames);
  const fullUserPrompt =
    `RIGHT OF WAY DOCUMENT TEXT (Landing AI OCR Extracted):\n${"=".repeat(80)}\n\n` +
    args.extractedText.slice(0, 150_000) +
    `\n\n${"=".repeat(80)}\n\n${userPrompt}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: fullUserPrompt },
  ];

  let results: EvaluationResult[] = [];
  try {
    const r = await args.llm.call({
      provider: args.provider,
      model: args.model,
      messages,
      temperature: 0,
      maxTokens: 8000,
    });
    results = parseChunkResults(r.text, categoryNames);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[row-appraisal] chunk LLM call failed:", msg);
    return categoryNames.map((cat) => errorResult(cat, "API call failed"));
  }

  // Retry once if any expected categories missing
  if (results.length < categoryNames.length) {
    try {
      const r = await args.llm.call({
        provider: args.provider,
        model: args.model,
        messages,
        temperature: 0,
        maxTokens: 8000,
      });
      const retry = parseChunkResults(r.text, categoryNames);
      if (retry.length > results.length) results = retry;
    } catch {
      /* retry failed; fall through */
    }

    const have = new Set(results.map((r) => r.category));
    for (const cat of categoryNames) {
      if (!have.has(cat)) {
        results.push(errorResult(cat, "API did not return result for this category after retry"));
      }
    }
  }
  return results;
}

function errorResult(cat: string, comment: string): EvaluationResult {
  return {
    category: cat,
    score: 0,
    criteria_met: "Evaluation failed",
    evidence: "No response from model",
    status: "❌ Error",
    comments: comment,
  };
}
