import { describe, it, expect, vi } from "vitest";
import { reportStep } from "./report-step";
import type { StepContext } from "@/lib/usecases/types";

vi.mock("@/lib/usecases/cucp-reevals/report/markdown", () => ({
  generateFinalMarkdownReport: vi.fn(
    (_l1: unknown, _l2: unknown, _l3: unknown, _overrides: unknown, _date: unknown, _session: unknown) =>
      "# CUCP EVALUATION REPORT\n## PART 1 – EVALUATION TABLE",
  ),
}));

const sampleL1 = {
  firm_name: "Acme",
  cross_reference_result: "1500000",
  narrative_pnw: "NOT PROVIDED",
  extracted_facts: [],
};
const sampleL2 = { classifications: [] };
const sampleL3 = {
  criteria: [],
  final_decision: "Yes",
  certifier_comments: "ok",
};

function makeCtx(overrides: unknown[] = []): StepContext {
  return {
    userId: "u", projectId: "_test", runId: "r",
    prior: {
      level1: sampleL1,
      level2: sampleL2,
      level3: sampleL3,
      overrides,
    },
    staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
    llm: { call: vi.fn() } as any,
    abortSignal: new AbortController().signal, log: vi.fn(),
  };
}

async function collect<T>(iter: AsyncIterable<T>) { const out: T[] = []; for await (const ev of iter) out.push(ev); return out; }

describe("reportStep", () => {
  it("emits progress then stage-done with markdown_report and evaluation_date", async () => {
    const ctx = makeCtx();
    const events = await collect(reportStep.run(new FormData(), ctx));
    const done: any = events.find((e: any) => e.type === "stage-done");
    expect(done).toBeDefined();
    expect(done.data.markdown_report).toContain("PART 1");
    expect(done.data.evaluation_date).toBeDefined();
    expect(done.data.analyst_overrides).toEqual([]);
  });

  it("passes overrides from ctx.prior.overrides into the report", async () => {
    const overrides = [{ s_no: 1, field: "pass_fail", value: "Fail", reasoning: "manual" }];
    const ctx = makeCtx(overrides);
    const events = await collect(reportStep.run(new FormData(), ctx));
    const done: any = events.find((e: any) => e.type === "stage-done");
    expect(done.data.analyst_overrides).toEqual(overrides);
  });

  it("emits a progress event before stage-done", async () => {
    const ctx = makeCtx();
    const events = await collect(reportStep.run(new FormData(), ctx));
    const types = events.map((e: any) => e.type);
    expect(types.indexOf("progress")).toBeLessThan(types.indexOf("stage-done"));
  });

  it("threads ctx.staged precedents and field overrides into session_overrides on stage-done", async () => {
    const ctx = makeCtx();
    ctx.staged.level_2_precedents.push({ target: "Social Disadvantage", correction: "Economic Disadvantage", human_reasoning: "r", fact_id: "fact_1" });
    ctx.staged.level_3_precedents.push({ target: "Crit 2", correction: "Fail", human_reasoning: "r", s_no: 2 });
    ctx.staged.l1_field_overrides = { firm_name: { value: "Acme LLC", reason: "typo" } };
    const events = await collect(reportStep.run(new FormData(), ctx));
    const done: any = events.find((e: any) => e.type === "stage-done");
    expect(done.data.session_overrides).toBeDefined();
    expect(done.data.session_overrides.l2Precedents).toHaveLength(1);
    expect(done.data.session_overrides.l3Precedents).toHaveLength(1);
    expect(done.data.session_overrides.l1FieldOverrides.firm_name?.value).toBe("Acme LLC");
  });
});
