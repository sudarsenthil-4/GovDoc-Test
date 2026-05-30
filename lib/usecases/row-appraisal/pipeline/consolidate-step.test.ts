import { describe, it, expect } from "vitest";
import { consolidateStep } from "./consolidate-step";
import type { StepContext } from "@/lib/usecases/types";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";
import { VALID_CATEGORIES } from "@/lib/usecases/row-appraisal/data/valid-categories";

// Build ~30 EvaluationResults: all VALID_CATEGORIES minus last 4, plus 2 duplicates
function makeResult(category: string, overrides?: Partial<EvaluationResult>): EvaluationResult {
  return {
    category,
    score: 4,
    criteria_met: "Meets criteria",
    evidence: "Found on page 1",
    status: "✅ Pass",
    comments: "OK",
    ...overrides,
  };
}

const PRESENT_CATEGORIES = VALID_CATEGORIES.slice(0, -4);

const rawResults: EvaluationResult[] = [
  // 30 present categories
  ...PRESENT_CATEGORIES.map((cat) => makeResult(cat)),
  // 2 duplicates of the first two (should be deduped)
  makeResult(VALID_CATEGORIES[0], { score: 2, status: "❌ Fail" }),
  makeResult(VALID_CATEGORIES[1], { score: 1, status: "❌ Fail" }),
];

function makeCtx(): StepContext {
  return {
    userId: "u",
    projectId: "_test",
    runId: "r",
    prior: {
      extract: {
        pdf_filename: "TestAppraisal.pdf",
        markdown_asset: "landing_ai_output.md",
      },
      evaluate: {
        raw_results: rawResults,
      },
    },
    staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
    llm: { call: async () => ({ text: "" }) },
    abortSignal: new AbortController().signal,
    log: () => {},
  };
}

async function collect(iter: AsyncIterable<unknown>) {
  const out: any[] = [];
  for await (const ev of iter) out.push(ev);
  return out;
}

describe("row-appraisal consolidateStep", () => {
  it("emits stage-done with evaluation_results.length === 34 sorted in VALID_CATEGORIES order", async () => {
    const ctx = makeCtx();
    const events = await collect(consolidateStep.run(undefined as any, ctx));

    const done = events.find((e) => e.type === "stage-done") as any;
    expect(done).toBeDefined();
    expect(done.stage).toBe("consolidate");

    const results: EvaluationResult[] = done.data.evaluation_results;
    expect(results).toHaveLength(34);

    // First 3 categories must match VALID_CATEGORIES order
    expect(results[0]!.category).toBe("Title Page");
    expect(results[1]!.category).toBe("Certificate of Appraiser");
    expect(results[2]!.category).toBe("Senior Review Certificate");

    // All results should be in VALID_CATEGORIES order
    for (let i = 0; i < results.length; i++) {
      expect(results[i]!.category).toBe(VALID_CATEGORIES[i]);
    }
  });

  it("markdown_table starts with correct header", async () => {
    const ctx = makeCtx();
    const events = await collect(consolidateStep.run(undefined as any, ctx));

    const done = events.find((e) => e.type === "stage-done") as any;
    expect(done.data.markdown_table).toMatch(
      /^\| Category \| Score \| Criteria Met \| Evidence \| Status \| Comments \|/,
    );
  });

  it("propagates pdf_filename and markdown_asset", async () => {
    const ctx = makeCtx();
    const events = await collect(consolidateStep.run(undefined as any, ctx));

    const done = events.find((e) => e.type === "stage-done") as any;
    expect(done.data.pdf_filename).toBe("TestAppraisal.pdf");
    expect(done.data.markdown_asset).toBe("landing_ai_output.md");
  });

  it("emits multiple progress events and a stage-done", async () => {
    const ctx = makeCtx();
    const events = await collect(consolidateStep.run(undefined as any, ctx));

    const progressEvents = events.filter((e) => e.type === "progress" && e.stage === "consolidate");
    expect(progressEvents.length).toBeGreaterThanOrEqual(3);

    const done = events.find((e) => e.type === "stage-done");
    expect(done).toBeDefined();
  });

  it("renders score -1 as N/A in markdown table", async () => {
    const ctx = makeCtx();
    // Override prior to include a score=-1 result
    const naResult = makeResult("Appraisal Maps", { score: -1, status: "⚪ N/A" });
    (ctx.prior.evaluate as any).raw_results = [
      ...rawResults.filter((r) => r.category !== "Appraisal Maps"),
      naResult,
    ];

    const events = await collect(consolidateStep.run(undefined as any, ctx));
    const done = events.find((e) => e.type === "stage-done") as any;

    expect(done.data.markdown_table).toContain("N/A");
  });

  it("evaluation_date is an ISO string", async () => {
    const ctx = makeCtx();
    const events = await collect(consolidateStep.run(undefined as any, ctx));
    const done = events.find((e) => e.type === "stage-done") as any;

    expect(typeof done.data.evaluation_date).toBe("string");
    expect(() => new Date(done.data.evaluation_date)).not.toThrow();
    // Should be a valid date
    expect(new Date(done.data.evaluation_date).getTime()).toBeGreaterThan(0);
  });
});
