# ROW Vision Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port caltrans's vision fallback so map-based ROW categories that score 1 via OCR get rescored using GPT-4o Vision against rendered PDF page images, matching `landing_ai_row_eval_chunked.py:1583` (`apply_vision_fallback`) behavior.

**Architecture:** Extend `LlmRouter` for multimodal content; render PDF pages to base64 PNG via `pdfjs-dist` + `@napi-rs/canvas` (no native deps for Cloud Run); add a post-eval `applyVisionFallback()` step that scans for `score=1` in `VISION_FALLBACK_CATEGORIES` and replaces results with vision-based scores when available.

**Tech Stack:** Next.js route handlers, OpenAI multimodal Chat Completions, `pdfjs-dist`, `@napi-rs/canvas`, vitest.

---

### Task 1: Extend LlmRouter to support multimodal content

**Files:**
- Modify: `lib/llm/types.ts`
- Modify: `lib/llm/openai.ts`
- Modify: `lib/llm/router.ts` (only if it transforms messages — likely just passes through)
- Test: `lib/llm/openai.test.ts`

**Why:** Caltrans's `evaluate_with_vision` sends `[{"type": "text", ...}, {"type": "image_url", "image_url": {"url": "data:image/png;base64,...", "detail": "high"}}]` as a single user message. Govdoc's `LlmCall.messages[].content` is currently `string`, so vision is impossible.

- [ ] **Step 1: Widen the content type in `LlmCall`**

```typescript
// lib/llm/types.ts
export type LlmTextPart = { type: "text"; text: string };
export type LlmImagePart = { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } };
export type LlmContent = string | Array<LlmTextPart | LlmImagePart>;

export type LlmCall = {
  provider: LlmProvider;
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: LlmContent }[];
  // ...rest unchanged
};
```

- [ ] **Step 2: Update `lib/llm/openai.ts` to pass content arrays through unchanged**

The OpenAI Chat Completions API natively accepts the same `[{type: "text", text}, {type: "image_url", image_url}]` shape, so no transformation is needed. Just verify the type widening compiles and the existing string path still works.

- [ ] **Step 3: Add a unit test asserting multimodal payload reaches the OpenAI client unchanged**

```typescript
// lib/llm/openai.test.ts (add a new case)
it("passes multimodal content arrays through to the OpenAI client", async () => {
  const fakeFetch = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] })));
  global.fetch = fakeFetch as any;
  await callOpenAi({
    provider: "openai",
    model: "gpt-4o",
    messages: [{ role: "user", content: [
      { type: "text", text: "Look at this:" },
      { type: "image_url", image_url: { url: "data:image/png;base64,AAAA", detail: "high" } },
    ] }],
  });
  const body = JSON.parse(fakeFetch.mock.calls[0]![1]!.body as string);
  expect(body.messages[0].content).toEqual([
    { type: "text", text: "Look at this:" },
    { type: "image_url", image_url: { url: "data:image/png;base64,AAAA", detail: "high" } },
  ]);
});
```

- [ ] **Step 4: Verify anthropic and groq providers still compile + reject multimodal at runtime cleanly**

- Anthropic: their API has a different multimodal shape; for now the openai.ts path is the only consumer. Either add a runtime check that throws "multimodal not supported" for non-openai, or just leave the union type to flow through and let the provider's API reject it. Latter is fine.

- [ ] **Step 5: Commit**

```bash
git add lib/llm/types.ts lib/llm/openai.ts lib/llm/openai.test.ts
git commit -m "feat(llm): widen LlmCall.content to support multimodal arrays"
```

---

### Task 2: Add a Node PDF→PNG renderer

**Files:**
- Create: `lib/usecases/row-appraisal/vision/render-pdf.ts`
- Create: `lib/usecases/row-appraisal/vision/render-pdf.test.ts`
- Modify: `package.json` — add `pdfjs-dist` and `@napi-rs/canvas` deps

**Why:** Caltrans uses pymupdf to render specific page ranges to base64 PNG at 150 DPI. Need a Node equivalent that runs in the Cloud Run image without native binaries.

- [ ] **Step 1: Add deps**

```bash
npm install pdfjs-dist @napi-rs/canvas
```

- [ ] **Step 2: Write the failing test**

```typescript
// render-pdf.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderPdfPagesAsImages } from "./render-pdf";

describe("renderPdfPagesAsImages", () => {
  it("returns base64 data URLs for the requested page range", async () => {
    const pdfBytes = readFileSync(join(process.cwd(), "tests/fixtures/row/sample.pdf"));
    const urls = await renderPdfPagesAsImages(pdfBytes, [1, 2], 150);
    expect(urls.length).toBe(2);
    expect(urls[0]).toMatch(/^data:image\/png;base64,/);
  });

  it("clamps page range to actual document length", async () => {
    const pdfBytes = readFileSync(join(process.cwd(), "tests/fixtures/row/sample.pdf"));
    const urls = await renderPdfPagesAsImages(pdfBytes, [1, 9999], 100);
    expect(urls.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Verify it fails** (the module doesn't exist yet)

- [ ] **Step 4: Implement `renderPdfPagesAsImages(pdfBytes, [start, end], dpi)` matching caltrans's behavior**

```typescript
// lib/usecases/row-appraisal/vision/render-pdf.ts
import { createCanvas } from "@napi-rs/canvas";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = ""; // disable worker — we run in Node

export async function renderPdfPagesAsImages(
  pdfBytes: Buffer,
  pageRange: [number, number],
  dpi = 150,
): Promise<string[]> {
  const loadingTask = getDocument({ data: new Uint8Array(pdfBytes) });
  const doc = await loadingTask.promise;
  const total = doc.numPages;
  const start = Math.max(1, pageRange[0]);
  const end = Math.min(total, pageRange[1]);
  const scale = dpi / 72;

  const urls: string[] = [];
  for (let n = start; n <= end; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx as any, viewport }).promise;
    const pngBuffer = canvas.toBuffer("image/png");
    urls.push(`data:image/png;base64,${pngBuffer.toString("base64")}`);
  }
  await doc.cleanup();
  return urls;
}
```

- [ ] **Step 5: Run test, verify pass**

- [ ] **Step 6: Add a sample fixture PDF if `tests/fixtures/row/sample.pdf` does not yet exist**

- [ ] **Step 7: Commit**

```bash
git add lib/usecases/row-appraisal/vision/ package.json package-lock.json tests/fixtures/row/sample.pdf
git commit -m "feat(row): add Node PDF→PNG renderer for vision fallback"
```

---

### Task 3: Port `get_vision_prompt_for_category` table verbatim

**Files:**
- Create: `lib/usecases/row-appraisal/vision/category-prompts.ts`
- Create: `lib/usecases/row-appraisal/vision/category-prompts.test.ts`

**Why:** Caltrans `landing_ai_row_eval_chunked.py:1385+` defines a per-category dict with `(vision_prompt, page_range)` for each of the 4 vision-fallback categories. This table is large (each prompt ~30 lines). Copy it verbatim — these are the exact instructions caltrans uses.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { getVisionPromptForCategory } from "./category-prompts";

describe("getVisionPromptForCategory", () => {
  it.each([
    ["Subject Assessor Map"],
    ["Subject Photos"],
    ["Comparable Map Sheet"],
    ["Appraisal Maps"],
  ])("returns prompt + page range for %s", (cat) => {
    const result = getVisionPromptForCategory(cat);
    expect(result).not.toBeNull();
    expect(result!.prompt).toContain(cat.split(" ")[0]!);
    expect(result!.pageRange[0]).toBeGreaterThanOrEqual(1);
    expect(result!.pageRange[1]).toBeGreaterThanOrEqual(result!.pageRange[0]);
  });

  it("returns null for unknown category", () => {
    expect(getVisionPromptForCategory("Bogus")).toBeNull();
  });
});
```

- [ ] **Step 2: Copy the four prompts and page ranges verbatim from caltrans `landing_ai_row_eval_chunked.py:1385-1500`**

```typescript
// lib/usecases/row-appraisal/vision/category-prompts.ts
type Entry = { prompt: string; pageRange: [number, number] };

const PROMPTS: Record<string, Entry> = {
  "Subject Assessor Map": {
    prompt: `You are analyzing PDF page images...`, // verbatim copy
    pageRange: [1, 5], // copy from caltrans
  },
  // ... all 4 categories
};

export function getVisionPromptForCategory(category: string): Entry | null {
  return PROMPTS[category] ?? null;
}
```

- [ ] **Step 3: Run test, verify pass**

- [ ] **Step 4: Commit**

```bash
git add lib/usecases/row-appraisal/vision/category-prompts.ts lib/usecases/row-appraisal/vision/category-prompts.test.ts
git commit -m "feat(row): port per-category vision prompts verbatim from caltrans"
```

---

### Task 4: Implement `applyVisionFallback()`

**Files:**
- Create: `lib/usecases/row-appraisal/vision/apply-vision-fallback.ts`
- Create: `lib/usecases/row-appraisal/vision/apply-vision-fallback.test.ts`

**Why:** Caltrans's `apply_vision_fallback()` takes the OCR results, finds `score=1` candidates in `VISION_FALLBACK_CATEGORIES`, calls vision for each, and replaces results when vision yields a higher score (or even an equal score for better evidence).

- [ ] **Step 1: Write the failing test (with a mocked LlmRouter)**

```typescript
import { describe, it, expect, vi } from "vitest";
import { applyVisionFallback } from "./apply-vision-fallback";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

const okJson = JSON.stringify({ score: 4, evidence: "Subject parcel highlighted in red.", comments: "Vision found the map." });

describe("applyVisionFallback", () => {
  it("upgrades score=1 to vision-derived score for vision-fallback categories", async () => {
    const llmCall = vi.fn(async () => ({ text: okJson }));
    const results: EvaluationResult[] = [{
      category: "Subject Assessor Map", score: 1, criteria_met: "x",
      evidence: "NOT FOUND", status: "❌ Fail", comments: "ocr",
    }];
    const out = await applyVisionFallback(results, Buffer.from([]), { call: llmCall });
    expect(out[0]!.score).toBe(4);
    expect(out[0]!.evidence).toContain("[VISION FALLBACK]");
    expect(out[0]!.status).toBe("✅ Pass");
  });

  it("skips categories not in VISION_FALLBACK_CATEGORIES", async () => {
    const llmCall = vi.fn();
    const results: EvaluationResult[] = [{
      category: "Title Page", score: 1, criteria_met: "x",
      evidence: "x", status: "❌ Fail", comments: "x",
    }];
    await applyVisionFallback(results, Buffer.from([]), { call: llmCall });
    expect(llmCall).not.toHaveBeenCalled();
  });

  it("skips categories where score > 1", async () => {
    const llmCall = vi.fn();
    const results: EvaluationResult[] = [{
      category: "Subject Assessor Map", score: 3, criteria_met: "x",
      evidence: "x", status: "⚠️ Warning", comments: "x",
    }];
    await applyVisionFallback(results, Buffer.from([]), { call: llmCall });
    expect(llmCall).not.toHaveBeenCalled();
  });

  it("returns vision result even when score is not improved (for better evidence)", async () => {
    const llmCall = vi.fn(async () => ({ text: JSON.stringify({ score: 1, evidence: "Map missing", comments: "vision confirmed" }) }));
    const results: EvaluationResult[] = [{
      category: "Subject Photos", score: 1, criteria_met: "x",
      evidence: "old", status: "❌ Fail", comments: "old",
    }];
    const out = await applyVisionFallback(results, Buffer.from([]), { call: llmCall });
    expect(out[0]!.evidence).toContain("[VISION FALLBACK]");
    expect(out[0]!.evidence).toContain("Map missing");
  });

  it("falls back to original on vision failure (LLM throws or bad JSON)", async () => {
    const llmCall = vi.fn(async () => { throw new Error("api down"); });
    const results: EvaluationResult[] = [{
      category: "Subject Assessor Map", score: 1, criteria_met: "x",
      evidence: "x", status: "❌ Fail", comments: "x",
    }];
    const out = await applyVisionFallback(results, Buffer.from([]), { call: llmCall });
    expect(out[0]!.score).toBe(1); // unchanged
  });
});
```

- [ ] **Step 2: Implement `applyVisionFallback`**

Mirror caltrans `apply_vision_fallback` and `evaluate_with_vision` exactly:

```typescript
// lib/usecases/row-appraisal/vision/apply-vision-fallback.ts
import type { LlmRouter } from "@/lib/llm/types";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";
import { VISION_FALLBACK_CATEGORIES } from "@/lib/usecases/row-appraisal/data/valid-categories";
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
  } catch {
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
      provider: "openai", model: VISION_MODEL, temperature: 0,
      maxTokens: 1500,
      messages: [{ role: "user", content }],
    });
  } catch {
    return null;
  }

  let parsed: { score?: number | string; evidence?: string; comments?: string };
  try {
    let text = response.text.trim();
    if (text.startsWith("```json")) text = text.slice(7);
    if (text.startsWith("```")) text = text.slice(3);
    if (text.endsWith("```")) text = text.slice(0, -3);
    parsed = JSON.parse(text.trim());
  } catch {
    return null;
  }

  let score = parsed.score ?? 1;
  if (typeof score === "string") {
    if (score.toUpperCase().includes("N/A")) score = -1;
    else { const m = score.match(/(\d)/); score = m ? Number(m[1]) : 1; }
  } else {
    score = Number(score);
  }

  const status =
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
```

- [ ] **Step 3: Run tests, verify all pass**

- [ ] **Step 4: Commit**

---

### Task 5: Wire `applyVisionFallback` into the evaluate-step

**Files:**
- Modify: `lib/usecases/row-appraisal/pipeline/evaluate-step.ts`
- Modify: `lib/usecases/row-appraisal/pipeline/evaluate-step.test.ts`

**Why:** Caltrans calls `apply_vision_fallback(evaluation_results, pdf_bytes)` at the end of `generate_validation_report` (line 1679), after the chunked OCR loop completes. We need to do the same after the chunked loop in `evaluate-step.ts`.

**Critical context:** govdoc's evaluate-step currently doesn't have access to PDF bytes — it only sees `extractedText`. The PDF is uploaded to extract-step. Need to plumb PDF bytes from extract-step's stage-done into ctx.prior so evaluate-step can read them.

- [ ] **Step 1: Update extract-step to include PDF bytes (base64) in stage-done payload**

```typescript
// lib/usecases/row-appraisal/pipeline/extract-step.ts
const file = pdf as File;
const pdfBuffer = Buffer.from(await file.arrayBuffer());
// ...
yield {
  type: "stage-done",
  stage: "extract",
  data: {
    pdf_filename: file.name,
    pdf_bytes_b64: pdfBuffer.toString("base64"),
    markdown_asset: result.asset,
    extracted_text: result.text,
    provider: "openai",
    model: "gpt-4.1",
  },
};
```

- [ ] **Step 2: In evaluate-step, decode the PDF and call applyVisionFallback before stage-done**

```typescript
// after the chunk loop:
const pdfB64 = (prior as { pdf_bytes_b64?: string }).pdf_bytes_b64;
const pdfBytes = pdfB64 ? Buffer.from(pdfB64, "base64") : null;
let finalResults = allResults;
if (pdfBytes) {
  yield { type: "progress", stage: "evaluate", pct: 95, message: "Running vision fallback for map categories" };
  finalResults = await applyVisionFallback(allResults, pdfBytes, ctx.llm);
}
yield { type: "stage-done", stage: "evaluate", data: { raw_results: finalResults } };
```

- [ ] **Step 3: Update evaluate-step.test.ts to pass `prior.extract.pdf_bytes_b64` and assert vision is invoked when score=1 categories exist**

- [ ] **Step 4: Run all tests for row-appraisal — verify nothing else broke**

- [ ] **Step 5: Commit**

---

### Task 6: Update Cloud Run / build config for the new deps

**Files:**
- Modify: `next.config.ts` — confirm `serverExternalPackages` covers `pdfjs-dist`, `@napi-rs/canvas` (the latter has native binaries)
- Modify: `Dockerfile` (if any) — verify no system packages needed (`@napi-rs/canvas` ships its own binaries)
- Modify: `.gcloudignore` — confirm node_modules pattern includes the new deps' binaries

- [ ] **Step 1: Read `next.config.ts`. Add `pdfjs-dist` and `@napi-rs/canvas` to `serverExternalPackages` if not already present.**

- [ ] **Step 2: Verify build succeeds locally:**

```bash
npm run build
```

- [ ] **Step 3: Run the deploy script in dry-run mode** if available, otherwise just verify the deploy step won't fail on missing files.

- [ ] **Step 4: Commit**

---

### Task 7: Manual end-to-end verification

- [ ] **Step 1: Run `npm run dev`**
- [ ] **Step 2: Upload one of the bundled PDFs, run evaluation**
- [ ] **Step 3: Confirm vision fallback fires for any map category that scored 1 (look for `[VISION FALLBACK]` prefix in evidence column)**
- [ ] **Step 4: Confirm latency is acceptable (vision adds ~5–10s per affected category)**
- [ ] **Step 5: Hand off for the deploy step (Plan 5 M10)**

---

## Notes

- **Cost:** 4 vision-fallback categories × ~3 page images × ~3000 input tokens × $5/1M input ≈ $0.05 per appraisal worst-case.
- **Failure modes:** If pdfjs-dist or canvas fail to render a page, we fall back to the original OCR result (no error surfaced to the user, just a log).
- **Why no streaming progress per category:** vision calls are short enough (<10s each) that one combined progress event is enough; matches caltrans CLI behavior.
- **Anthropic / Groq path:** This feature is OpenAI-only by design. Caltrans hardcoded `VISION_MODEL = "gpt-4o"`.
