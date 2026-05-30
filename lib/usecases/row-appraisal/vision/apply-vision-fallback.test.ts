import { describe, it, expect, vi } from "vitest";
import { applyVisionFallback } from "./apply-vision-fallback";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

// Stub out renderPdfPagesAsImages so we don't actually render PDFs in this unit test.
vi.mock("./render-pdf", () => ({
  renderPdfPagesAsImages: vi.fn(async () => ["data:image/png;base64,AAAA"]),
}));

const okJson = JSON.stringify({
  score: 4,
  evidence: "Subject parcel highlighted in red.",
  comments: "Vision found the map.",
});

function row(overrides: Partial<EvaluationResult>): EvaluationResult {
  return {
    category: "Subject Assessor Map",
    score: 1,
    criteria_met: "x",
    evidence: "NOT FOUND",
    status: "❌ Fail",
    comments: "ocr",
    ...overrides,
  };
}

describe("applyVisionFallback", () => {
  it("upgrades score=1 to vision-derived score for vision-fallback categories", async () => {
    const call = vi.fn(async () => ({ text: okJson }));
    const out = await applyVisionFallback([row({})], Buffer.from([]), { call });
    expect(out[0]!.score).toBe(4);
    expect(out[0]!.evidence).toContain("[VISION FALLBACK]");
    expect(out[0]!.status).toBe("✅ Pass");
    expect(out[0]!.criteria_met).toContain("Rubric Score 4");
  });

  it("skips categories not in VISION_FALLBACK_CATEGORIES", async () => {
    const call = vi.fn();
    await applyVisionFallback(
      [row({ category: "Title Page" })],
      Buffer.from([]),
      { call },
    );
    expect(call).not.toHaveBeenCalled();
  });

  it("skips categories where score > 1", async () => {
    const call = vi.fn();
    await applyVisionFallback(
      [row({ score: 3, status: "⚠️ Warning" })],
      Buffer.from([]),
      { call },
    );
    expect(call).not.toHaveBeenCalled();
  });

  it("replaces with vision result even when score is not improved (for better evidence)", async () => {
    const call = vi.fn(async () => ({
      text: JSON.stringify({ score: 1, evidence: "Map missing", comments: "vision confirmed" }),
    }));
    const out = await applyVisionFallback(
      [row({ category: "Subject Photos", evidence: "old", comments: "old" })],
      Buffer.from([]),
      { call },
    );
    expect(out[0]!.evidence).toBe("[VISION FALLBACK] Map missing");
    expect(out[0]!.comments).toBe("[Vision Fallback] vision confirmed");
  });

  it("falls back to original on vision LLM throw", async () => {
    const call = vi.fn(async () => { throw new Error("api down"); });
    const out = await applyVisionFallback([row({})], Buffer.from([]), { call });
    expect(out[0]!.score).toBe(1);
    expect(out[0]!.evidence).toBe("NOT FOUND");
  });

  it("falls back to original on bad JSON in response", async () => {
    const call = vi.fn(async () => ({ text: "not json at all" }));
    const out = await applyVisionFallback([row({})], Buffer.from([]), { call });
    expect(out[0]!.score).toBe(1);
  });

  it("strips ```json``` markdown fences before parsing", async () => {
    const call = vi.fn(async () => ({
      text: "```json\n" + JSON.stringify({ score: 5, evidence: "ok", comments: "ok" }) + "\n```",
    }));
    const out = await applyVisionFallback([row({})], Buffer.from([]), { call });
    expect(out[0]!.score).toBe(5);
  });

  it("calls OpenAI with gpt-4o, temperature 0, multimodal content array", async () => {
    const call = vi.fn(async () => ({ text: okJson }));
    await applyVisionFallback([row({})], Buffer.from([]), { call });
    expect(call).toHaveBeenCalledWith(expect.objectContaining({
      provider: "openai",
      model: "gpt-4o",
      temperature: 0,
      maxTokens: 1500,
    }));
    const args = (call.mock.calls as any)[0][0] as import("@/lib/llm/types").LlmCall;
    const content = args.messages[0]!.content;
    expect(Array.isArray(content)).toBe(true);
    expect((content as any[])[0].type).toBe("text");
    expect((content as any[])[1].type).toBe("image_url");
    expect((content as any[])[1].image_url.detail).toBe("high");
  });

  it("returns the original results array unchanged when no candidates exist", async () => {
    const call = vi.fn();
    const input = [row({ score: 5, status: "✅ Pass" })];
    const out = await applyVisionFallback(input, Buffer.from([]), { call });
    expect(out).toEqual(input);
    expect(call).not.toHaveBeenCalled();
  });

  it("coerces N/A string score to -1 with N/A status", async () => {
    const call = vi.fn(async () => ({
      text: JSON.stringify({ score: "N/A", evidence: "n/a", comments: "n/a" }),
    }));
    const out = await applyVisionFallback([row({})], Buffer.from([]), { call });
    expect(out[0]!.score).toBe(-1);
    expect(out[0]!.status).toBe("⚪ N/A");
  });
});
