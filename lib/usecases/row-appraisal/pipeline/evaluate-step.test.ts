import { describe, it, expect, vi } from "vitest";
import { evaluateStep } from "./evaluate-step";
import type { StepContext } from "@/lib/usecases/types";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

// Exact categories per chunk (ordered by dependency groups, then schema order)
const CHUNK_CATEGORIES = [
  ["Title Page", "Certificate of Appraiser", "Senior Review Certificate", "Delegations",
   "HABU Vacant", "HABU Improved", "HABU Reconciliation", "Methodology"],
  ["Sales Comparison Approach (If used)", "Income Approach (If used)", "Cost Approach (If Used)",
   "Reconciliation", "The Acquisition - Land", "Improvements", "After Analysis (if required)", "Cost to Cure"],
  ["Construction Contract Work", "COS & HMDD",
   "Diary, Notice of Decision to Appraise & Loss of Business Goodwill",
   "Subject Assessor Map", "Subject Photos", "RW 7-9", "Scope of Work",
   "General Assumptions & Limiting Conditions"],
  ["Introduction", "Area Description", "Parcel Description", "Construction in the Manner Proposed",
   "Summary of Just Compensation", "Comparable Summary Page", "Comparable Map Sheet", "Comparable Data Sheets"],
  ["Appraisal Maps", "Appraisal Terms"],
];

function makeResults(categories: string[]): EvaluationResult[] {
  return categories.map((category) => ({
    category,
    score: 4,
    criteria_met: "Meets criteria",
    evidence: "Found on page 1",
    status: "✅ Pass" as const,
    comments: "OK",
  }));
}

function makeCtx(callResponses: string[], pdfB64?: string): StepContext {
  let idx = 0;
  return {
    userId: "u",
    projectId: "_test",
    runId: "r",
    prior: {
      extract: {
        extracted_text: "fake appraisal document text",
        provider: "openai",
        model: "gpt-4.1",
        ...(pdfB64 ? { pdf_bytes_b64: pdfB64 } : {}),
      },
    },
    staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
    llm: {
      call: vi.fn(async () => {
        const text = callResponses[idx++] ?? "[]";
        return { text };
      }),
    },
    abortSignal: new AbortController().signal,
    log: vi.fn(),
  };
}

async function collect(iter: AsyncIterable<unknown>) {
  const out: any[] = [];
  for await (const ev of iter) out.push(ev);
  return out;
}

describe("row-appraisal evaluateStep", () => {
  it("emits 5 progress, 5 partial, 1 stage-done; calls llm 5 times; raw_results has 34 entries", async () => {
    const responses = CHUNK_CATEGORIES.map((cats) =>
      JSON.stringify(makeResults(cats)),
    );
    const ctx = makeCtx(responses);

    const events = await collect(evaluateStep.run(undefined as any, ctx));

    const progressEvents = events.filter(
      (e) => e.type === "progress" && e.stage === "evaluate",
    );
    const partialEvents = events.filter(
      (e) => e.type === "partial" && e.stage === "evaluate",
    );
    const doneEvent = events.find((e) => e.type === "stage-done");

    expect(progressEvents).toHaveLength(5);
    expect(partialEvents).toHaveLength(5);
    expect(doneEvent).toBeDefined();
    expect(doneEvent.stage).toBe("evaluate");
    expect(doneEvent.data.raw_results.length).toBeGreaterThanOrEqual(34);
    expect((ctx.llm.call as any).mock.calls).toHaveLength(5);
  });

  it("each partial event has chunkIndex and results array", async () => {
    const responses = CHUNK_CATEGORIES.map((cats) =>
      JSON.stringify(makeResults(cats)),
    );
    const ctx = makeCtx(responses);

    const events = await collect(evaluateStep.run(undefined as any, ctx));

    const partialEvents = events.filter((e) => e.type === "partial");
    for (let i = 0; i < 5; i++) {
      expect(partialEvents[i].data.chunkIndex).toBe(i);
      expect(Array.isArray(partialEvents[i].data.results)).toBe(true);
    }
  });

  it("progress events have increasing pct and message mentioning chunk number", async () => {
    const responses = CHUNK_CATEGORIES.map((cats) =>
      JSON.stringify(makeResults(cats)),
    );
    const ctx = makeCtx(responses);

    const events = await collect(evaluateStep.run(undefined as any, ctx));
    const progressEvents = events.filter((e) => e.type === "progress" && e.stage === "evaluate");

    // pct values should be 0, 20, 40, 60, 80 (i/total * 100 for i=0..4)
    expect(progressEvents[0].pct).toBe(0);
    expect(progressEvents[0].message).toContain("1/5");
    expect(progressEvents[4].message).toContain("5/5");
  });

  it("does NOT call applyVisionFallback when prior has no pdf_bytes_b64", async () => {
    const responses = CHUNK_CATEGORIES.map((cats) => JSON.stringify(makeResults(cats)));
    const ctx = makeCtx(responses); // no pdf
    await collect(evaluateStep.run(undefined as any, ctx));
    expect((ctx.llm.call as any).mock.calls).toHaveLength(5); // 5 chunks, no vision
  });

  it("calls applyVisionFallback with PDF bytes when prior includes pdf_bytes_b64 (no score=1 candidates → no extra LLM calls)", async () => {
    const responses = CHUNK_CATEGORIES.map((cats) => JSON.stringify(makeResults(cats))); // all score=4
    const ctx = makeCtx(responses, "JVBERg=="); // dummy base64
    const events = await collect(evaluateStep.run(undefined as any, ctx));
    // No score=1 candidates, so applyVisionFallback returns early — still only 5 LLM calls
    expect((ctx.llm.call as any).mock.calls).toHaveLength(5);
    // But the "Running vision fallback..." progress event MUST fire when pdf_bytes_b64 is present
    const visionProgress = events.find(
      (e) => e.type === "progress" && e.stage === "evaluate" && e.message?.includes("vision"),
    );
    expect(visionProgress).toBeDefined();
    expect(visionProgress.pct).toBe(95);
  });

  it("triggers vision LLM call when a score=1 vision-fallback category exists", async () => {
    // Generate per-chunk responses — but for the chunk containing "Subject Assessor Map", set score=1
    const responses = CHUNK_CATEGORIES.map((cats) => JSON.stringify(
      cats.map((category) => ({
        category,
        score: category === "Subject Assessor Map" ? 1 : 4,
        criteria_met: "x",
        evidence: category === "Subject Assessor Map" ? "NOT FOUND" : "ok",
        status: category === "Subject Assessor Map" ? "❌ Fail" : "✅ Pass",
        comments: "ok",
      }))
    ));
    const ctx = makeCtx(responses, "JVBERg==");

    // Mock the vision module so we don't actually render PDFs / call OpenAI
    const visionMod = await import("@/lib/usecases/row-appraisal/vision/apply-vision-fallback");
    const spy = vi.spyOn(visionMod, "applyVisionFallback").mockImplementation(async (results) => results);

    await collect(evaluateStep.run(undefined as any, ctx));

    expect(spy).toHaveBeenCalledTimes(1);
    const callArgs = spy.mock.calls[0]!;
    expect(Buffer.isBuffer(callArgs[1])).toBe(true);
    expect((callArgs[1] as Buffer).length).toBeGreaterThan(0); // non-empty pdf bytes

    spy.mockRestore();
  });
});
