import { describe, it, expect, vi } from "vitest";
import { evaluateStep } from "./evaluate-step";
import type { StepContext, StepEvent } from "@/lib/usecases/types";
import type { LlmRouter } from "@/lib/llm/types";

const FIXTURE_EVAL = {
  project_name: "Test", project_ea: "0421000123", district: "04",
  evaluation_date: "2026-05-05",
  ratings: Array.from({ length: 25 }, (_, i) => ({
    question_id: i < 10 ? `A${i+1}` : i < 12 ? `B${i-9}` : i < 14 ? `C${i-11}` : i < 17 ? `D${i-13}` : i < 22 ? `E${i-16}` : `F${i-21}`,
    question_text: "stub", source_reasoning: "stub", missing_info_reasoning: "None",
    selected_rating: "B", confidence: 0.85, missing_info: false,
  })),
  missing_questions: [], summary: "All clear.",
};

function makeCtx(call: LlmRouter["call"]): StepContext {
  return {
    userId: "test", projectId: "_test", runId: "r1", prior: { extract: { narrative: "test narrative" } },
    staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
    llm: { call },
    abortSignal: new AbortController().signal,
    log: () => {},
  };
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of iter) out.push(x);
  return out;
}

describe("evaluateStep", () => {
  it("calls LLM and yields stage-done with parsed CmgcEvaluation", async () => {
    const fd = new FormData();
    const call = vi.fn(async () => ({ text: JSON.stringify(FIXTURE_EVAL) }));
    const events = await collect(evaluateStep.run(fd, makeCtx(call))) as StepEvent[];
    expect(call).toHaveBeenCalledOnce();
    const stageDone = events.find((e) => e.type === "stage-done")!;
    expect((stageDone as Extract<StepEvent, { type: "stage-done" }>).data).toMatchObject({
      ratings: expect.any(Array),
    });
    const data = (stageDone as Extract<StepEvent, { type: "stage-done" }>).data as { ratings: unknown[] };
    expect(data.ratings).toHaveLength(25);
  });

  it("retries once on malformed JSON", async () => {
    const fd = new FormData();
    const call = vi.fn()
      .mockResolvedValueOnce({ text: "not valid json" })
      .mockResolvedValueOnce({ text: JSON.stringify(FIXTURE_EVAL) });
    const events = await collect(evaluateStep.run(fd, makeCtx(call))) as StepEvent[];
    expect(call).toHaveBeenCalledTimes(2);
    expect(events.find((e) => e.type === "stage-done")).toBeDefined();
  });

  it("yields error when LLM throws", async () => {
    const fd = new FormData();
    const call = vi.fn(async () => { throw new Error("rate limit"); });
    const events = await collect(evaluateStep.run(fd, makeCtx(call))) as StepEvent[];
    const last = events.at(-1)!;
    expect(last).toMatchObject({ type: "error", stage: "evaluate" });
    // Sanitized — should NOT echo "rate limit" or provider details
    expect((last as Extract<StepEvent, { type: "error" }>).message).toBe("AI evaluation failed");
  });

  it("yields sanitized error when both attempts return malformed JSON", async () => {
    const fd = new FormData();
    const call = vi.fn()
      .mockResolvedValueOnce({ text: "not valid json {{{" })
      .mockResolvedValueOnce({ text: "also bad json >>>" });
    const events = await collect(evaluateStep.run(fd, makeCtx(call))) as StepEvent[];
    expect(call).toHaveBeenCalledTimes(2);
    const last = events.at(-1)! as Extract<StepEvent, { type: "error" }>;
    expect(last.type).toBe("error");
    expect(last.message).toBe("AI evaluation failed");
  });

  it("yields error when narrative is missing", async () => {
    const fd = new FormData();
    const ctx: StepContext = {
      userId: "test", projectId: "_test", runId: "r1", prior: {},
      staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
      llm: { call: vi.fn() },
      abortSignal: new AbortController().signal,
      log: () => {},
    };
    const events = await collect(evaluateStep.run(fd, ctx)) as StepEvent[];
    expect(events.at(-1)).toMatchObject({ type: "error", stage: "evaluate" });
  });
});
