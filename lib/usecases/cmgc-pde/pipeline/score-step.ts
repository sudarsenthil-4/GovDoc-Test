import type { PipelineStep } from "@/lib/usecases/types";
import type { CmgcRating } from "../types";
import { computeDeliveryRecommendation } from "../scoring/compute-recommendation";
import { scoreAllMethods } from "../scoring/score-all-methods";

export const scoreStep: PipelineStep<FormData> = {
  id: "score",
  label: "Compute scores and recommendation",
  async *run(_formData, ctx) {
    const prior = (ctx.prior.evaluate ?? {}) as { ratings?: CmgcRating[] };
    const ratings = prior.ratings;
    if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
      yield { type: "error", stage: "score", message: "No ratings available from evaluate step" };
      return;
    }

    yield { type: "progress", stage: "score", pct: 0, message: "Computing scores" };

    const recommendation = computeDeliveryRecommendation(ratings);
    const multiMethod = scoreAllMethods(ratings);

    yield { type: "progress", stage: "score", pct: 50, message: "Computing recommendation" };

    if (multiMethod.method_scores.length > 0) {
      const top = multiMethod.method_scores[0]!;
      // Prefer sections marked Strong fit / Poor fit per legacy 815-832; fall back to all sections
      const evidenceSnippets: string[] = [];
      const relevantSections = new Set(top.key_factors.map((kf) => kf.split(":")[0]?.trim()).filter(Boolean));
      const useAllSections = relevantSections.size === 0;
      for (const r of ratings) {
        const sec = r.question_id?.[0];
        if (sec && (useAllSections || relevantSections.has(sec))) {
          const quote = (r.source_reasoning ?? "").trim();
          if (quote && !quote.includes("No direct evidence")) {
            const snippet = quote.length > 300 ? quote.slice(0, 300) + "..." : quote;
            evidenceSnippets.push(`[${r.question_id}] ${snippet}`);
          }
        }
      }
      if (evidenceSnippets.length > 0) {
        yield { type: "progress", stage: "score", pct: 80, message: "Generating reasoning" };
        try {
          const r = await ctx.llm.call({
            provider: "openai",
            model: "gpt-4o-mini",
            temperature: 0.2,
            maxTokens: 120,
            messages: [
              { role: "system", content: `You are a Caltrans delivery method advisor. Based on the evaluation evidence below, write exactly 2 sentences explaining in plain English why '${top.method}' is the best fit for this project. Be specific — reference the actual project characteristics mentioned in the evidence. Do not use vague phrases like 'this method is ideal.' Focus on what makes this project's constraints align with ${top.method}.` },
              { role: "user", content: "Evaluation evidence:\n" + evidenceSnippets.slice(0, 8).join("\n") },
            ],
          });
          top.key_factors_reasoning = r.text.trim();
        } catch {
          // Always fail gracefully (legacy 856-857)
          top.key_factors_reasoning = "";
        }
      }
    }

    yield { type: "stage-done", stage: "score", data: { recommendation, multi_method: multiMethod } };
  },
};
