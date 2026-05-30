import { describe, it, expect } from "vitest";
import { runOneChunk } from "./run-chunk";
import type { LlmRouter } from "@/lib/llm/types";
import type { ChunkRubric } from "../rules/prompt-builder";

// Helper: build a minimal 8-category ChunkRubric
function makeRubric(cats: string[]): ChunkRubric {
  return Object.fromEntries(cats.map((c) => [c, { "1": "fail", "5": "pass" }]));
}

// Stub LLM: returns responses in sequence; tracks call count
function stubLlm(responses: string[]): { router: LlmRouter; calls: () => number } {
  let i = 0;
  const router: LlmRouter = {
    call: async () => ({ text: responses[i++] ?? "[]" }),
  };
  return { router, calls: () => i };
}

// Build a valid JSON response for the given category names
function validJson(cats: string[]): string {
  return JSON.stringify(
    cats.map((c) => ({
      category: c,
      score: 3,
      criteria_met: "ok",
      evidence: "some evidence",
      status: "pass",
      comments: "",
    })),
  );
}

const EIGHT_CATS = [
  "Title Page",
  "Certificate of Appraiser",
  "Senior Review Certificate",
  "Delegations",
  "HABU Vacant",
  "HABU Improved",
  "HABU Reconciliation",
  "Methodology",
];

const chunkRubric = makeRubric(EIGHT_CATS);
const provider = "openai" as const;
const model = "gpt-4o";
const extractedText = "some document text";

describe("runOneChunk", () => {
  it("LLM returns all 8 → 8 results, no retry (llm.call called once)", async () => {
    const { router, calls } = stubLlm([validJson(EIGHT_CATS)]);

    const results = await runOneChunk({ chunkRubric, extractedText, llm: router, provider, model });

    expect(results.length).toBe(8);
    expect(calls()).toBe(1);
  });

  it("LLM returns 6, retry returns 8 → 8 results (llm.call called twice)", async () => {
    const first6 = EIGHT_CATS.slice(0, 6);
    const { router, calls } = stubLlm([validJson(first6), validJson(EIGHT_CATS)]);

    const results = await runOneChunk({ chunkRubric, extractedText, llm: router, provider, model });

    expect(results.length).toBe(8);
    expect(calls()).toBe(2);
  });

  it("LLM returns 6, retry also returns 6 → 8 results with 2 error placeholders", async () => {
    const first6 = EIGHT_CATS.slice(0, 6);
    const { router, calls } = stubLlm([validJson(first6), validJson(first6)]);

    const results = await runOneChunk({ chunkRubric, extractedText, llm: router, provider, model });

    expect(results.length).toBe(8);
    expect(calls()).toBe(2);

    const errors = results.filter(
      (r) => r.comments === "API did not return result for this category after retry",
    );
    expect(errors.length).toBe(2);
    for (const e of errors) {
      expect(e.score).toBe(0);
      expect(e.status).toBe("❌ Error");
    }
  });

  it("LLM throws on first call → 8 error placeholders with 'API call failed', no retry", async () => {
    let callCount = 0;
    const router: LlmRouter = {
      call: async () => {
        callCount++;
        throw new Error("network failure");
      },
    };

    const results = await runOneChunk({ chunkRubric, extractedText, llm: router, provider, model });

    expect(results.length).toBe(8);
    expect(callCount).toBe(1);
    for (const r of results) {
      expect(r.score).toBe(0);
      expect(r.status).toBe("❌ Error");
      expect(r.comments).toBe("API call failed");
    }
  });

  it("LLM returns all 8 on first call → retry path does not run (call count stays at 1)", async () => {
    // Even if we pass a second response, it should never be consumed
    const { router, calls } = stubLlm([validJson(EIGHT_CATS), validJson(EIGHT_CATS)]);

    const results = await runOneChunk({ chunkRubric, extractedText, llm: router, provider, model });

    expect(results.length).toBe(8);
    expect(calls()).toBe(1);
  });
});
