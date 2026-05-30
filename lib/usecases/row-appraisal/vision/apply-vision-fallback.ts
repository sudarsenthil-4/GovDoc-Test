import type { LlmRouter } from "@/lib/llm/types";
import type { EvaluationResult, Status } from "@/lib/usecases/row-appraisal/types";
import { VISION_FALLBACK_CATEGORIES } from "@/lib/usecases/row-appraisal/data/valid-categories";
import { logger } from "@/lib/logger";
import { getVisionPromptForCategory } from "./category-prompts";
import { renderPdfPagesAsImages } from "./render-pdf";

const VISION_MODEL = "gpt-4o";

export async function applyVisionFallback(
  results: EvaluationResult[],
  pdfBytes: Buffer,
  llm: LlmRouter,
): Promise<EvaluationResult[]> {
  const candidates = results.filter(
    (r) => VISION_FALLBACK_CATEGORIES.has(r.category) && r.score === 1,
  );
  if (candidates.length === 0) return results;

  const out = [...results];
  for (const candidate of candidates) {
    const visionResult = await evaluateWithVision(pdfBytes, candidate.category, llm);
    if (!visionResult) continue;
    const idx = out.findIndex((r) => r.category === candidate.category);
    // Replace even when score didn't improve — vision provides richer evidence (mirrors caltrans).
    if (idx >= 0) out[idx] = visionResult;
  }
  return out;
}

async function evaluateWithVision(
  pdfBytes: Buffer,
  category: string,
  llm: LlmRouter,
): Promise<EvaluationResult | null> {
  const entry = getVisionPromptForCategory(category);
  if (!entry) return null;

  let imageUrls: string[];
  try {
    imageUrls = await renderPdfPagesAsImages(pdfBytes, entry.pageRange, 150);
  } catch (err) {
    logger.warn({ category, err }, "vision: PDF render failed, skipping");
    return null;
  }
  if (imageUrls.length === 0) return null;

  const content = [
    { type: "text" as const, text: entry.prompt },
    ...imageUrls.map((url) => ({
      type: "image_url" as const,
      image_url: { url, detail: "high" as const },
    })),
  ];

  let response;
  try {
    response = await llm.call({
      provider: "openai",
      model: VISION_MODEL,
      temperature: 0,
      maxTokens: 1500,
      messages: [{ role: "user", content }],
    });
  } catch (err) {
    logger.warn({ category, err }, "vision: LLM call failed, skipping");
    return null;
  }

  let text = response.text.trim();
  if (text.startsWith("```json")) text = text.slice(7);
  if (text.startsWith("```")) text = text.slice(3);
  if (text.endsWith("```")) text = text.slice(0, -3);
  text = text.trim();

  let parsed: { score?: number | string; evidence?: string; comments?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  let score: number;
  const raw = parsed.score ?? 1;
  if (typeof raw === "string") {
    if (raw.toUpperCase().includes("N/A")) score = -1;
    else { const m = raw.match(/(\d)/); score = m ? Number(m[1]) : 1; }
  } else {
    score = Number(raw);
  }

  const status: Status =
    score === -1 ? "⚪ N/A" :
    score >= 4 ? "✅ Pass" :
    score === 3 ? "⚠️ Warning" : "❌ Fail";

  return {
    category,
    score,
    criteria_met: `Rubric Score ${score} criteria (determined by vision analysis)`,
    evidence: `[VISION FALLBACK] ${parsed.evidence ?? "See vision analysis"}`,
    status,
    comments: `[Vision Fallback] ${parsed.comments ?? "Vision-based evaluation."}`,
  };
}
