import { describe, it, expect, vi, beforeEach } from "vitest";
import { level3Step } from "./level-3-step";
import { resolveLevelDecision, __clearLevelRendezvous } from "@/lib/runs/level-rendezvous";
import { __setStoreRootForTests, loadPrecedents } from "@/lib/usecases/cucp-reevals/memory/store";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { StepContext } from "@/lib/usecases/types";

const sampleL3 = {
  criteria: [
    { s_no: 1, category: "Mandatory Eligibility Requirements", qualification: "No Race or Sex Presumptions", rule_requires: "...", evidence_summary: "summary", reasoning: "reasoning", pass_fail: "Pass", request_info: "No", confidence: 9.5 },
    { s_no: 2, category: "PNW", qualification: "Net Worth", rule_requires: "...", evidence_summary: "x", reasoning: "y", pass_fail: "Pass", request_info: "No", confidence: 9 },
  ],
  final_decision: "Yes",
  certifier_comments: "Approved.",
};

function makeCtx(callImpl: any, overrides: Partial<StepContext> = {}): StepContext {
  return {
    userId: "u",
    projectId: "_test",
    runId: "r",
    prior: {
      level1: {
        firm_name: "Acme",
        cross_reference_result: "1500000",
        narrative_pnw: "NOT PROVIDED",
        extracted_facts: [{ id: "fact_1", when: "2025", where: "CA", who: "Owner", what: "lost contract", why: "discrimination", magnitude: "$50k", demographic_flag: true, source_quote: "..." }],
      },
      level2: {
        classifications: [{ fact_id: "fact_1", classification: "Social Disadvantage", summary: "x", reasoning: "y" }],
      },
    },
    staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
    llm: { call: vi.fn(callImpl) } as any,
    abortSignal: new AbortController().signal,
    log: vi.fn(),
    ...overrides,
  };
}

async function driveToCompletion(
  iter: AsyncIterable<any>,
  runId: string,
  decisions: Array<{ action: "approve" } | { action: "override-and-rerun"; override: any }>,
): Promise<any[]> {
  const events: any[] = [];
  let nextDecisionIdx = 0;
  for await (const ev of iter) {
    events.push(ev);
    if (ev.type === "needs-input" && ev.stage === "level3") {
      const decision = decisions[nextDecisionIdx++] ?? { action: "approve" };
      queueMicrotask(() => resolveLevelDecision(runId, 3, decision));
    }
  }
  return events;
}

beforeEach(() => __clearLevelRendezvous());

describe("level3Step", () => {
  it("emits stage-done with parsed Level3Data, then exits on approve", async () => {
    const ctx = makeCtx(async () => ({ text: JSON.stringify(sampleL3) }));
    const events = await driveToCompletion(level3Step.run(new FormData(), ctx), "r", [{ action: "approve" }]);
    const stageDones = events.filter((e) => e.type === "stage-done");
    expect(stageDones).toHaveLength(1);
    expect(stageDones[0].data.criteria).toHaveLength(2);
    expect((ctx.prior as any).level3).toBeDefined();
  });

  it("retries once on JSON parse failure and succeeds", async () => {
    let calls = 0;
    const ctx = makeCtx(async () => {
      calls++;
      return calls === 1 ? { text: "not json" } : { text: JSON.stringify(sampleL3) };
    });
    const events = await driveToCompletion(level3Step.run(new FormData(), ctx), "r", [{ action: "approve" }]);
    expect(events.find((e) => e.type === "stage-done")).toBeDefined();
    expect(calls).toBe(2);
  });

  it("emits error and logs internal detail when both retries fail", async () => {
    const ctx = makeCtx(async () => ({ text: "still not json" }));
    const events: any[] = [];
    for await (const ev of level3Step.run(new FormData(), ctx)) events.push(ev);
    const err = events.find((e) => e.type === "error");
    expect(err.message).toBe("AI Level 3 threshold evaluation failed");
    expect(err.message).not.toContain("JSON");
    expect(ctx.log).toHaveBeenCalled();
  });

  it("emits error if provider rejects", async () => {
    const ctx = makeCtx(async () => { throw new Error("boom"); });
    const events: any[] = [];
    for await (const ev of level3Step.run(new FormData(), ctx)) events.push(ev);
    const err = events.find((e) => e.type === "error");
    expect(err.message).toBe("AI Level 3 threshold evaluation failed");
  });

  it("override-and-rerun: appends a staged precedent and re-runs with it in the prompt", async () => {
    const calls: string[] = [];
    const llm = vi.fn(async ({ messages }: any) => {
      const sys = messages[0].content;
      calls.push(sys);
      const isSecond = calls.length === 2;
      const passFail = isSecond ? "Fail" : "Pass";
      return { text: JSON.stringify({ ...sampleL3, criteria: [{ ...sampleL3.criteria[0], pass_fail: passFail }] }) };
    });
    const ctx = makeCtx(undefined as any, { llm: { call: llm } as any });

    await driveToCompletion(level3Step.run(new FormData(), ctx), "r", [
      { action: "override-and-rerun", override: { s_no: "1", verdict: "Fail", request_info: "No", reason: "Affidavit lacks dates and amounts." } },
      { action: "approve" },
    ]);

    expect(llm).toHaveBeenCalledTimes(2);
    expect(calls[1]).toContain("INSTITUTIONAL MEMORY - LEVEL 3 HUMAN CORRECTIONS");
    expect(calls[1]).toContain("Correction for 'No Race or Sex Presumptions': Fail");
    expect(ctx.staged.level_3_precedents).toHaveLength(1);
  });

  it("dangling override: s_no no longer present logs a warning and proceeds", async () => {
    const llm = vi.fn(async () => ({
      text: JSON.stringify({ ...sampleL3, criteria: [{ ...sampleL3.criteria[0], s_no: 99 }] }),
    }));
    const ctx = makeCtx(undefined as any, { llm: { call: llm } as any });
    await driveToCompletion(level3Step.run(new FormData(), ctx), "r", [
      { action: "override-and-rerun", override: { s_no: "5", verdict: "Pass", request_info: "No", reason: "out-of-range row referenced" } },
      { action: "approve" },
    ]);
    expect(ctx.log).toHaveBeenCalledWith(
      "level3 dangling override (s_no no longer present)",
      expect.objectContaining({ s_no: 5 }),
    );
    expect(ctx.staged.level_3_precedents).toHaveLength(1);
  });

  it("loads persisted L3 precedents from the project store", async () => {
    const root = mkdtempSync(join(tmpdir(), "l3-precedents-"));
    __setStoreRootForTests(root);
    writeFileSync(
      join(root, "proj-z.json"),
      JSON.stringify({
        level_1_precedents: [],
        level_2_precedents: [],
        level_3_precedents: [{ target: "Past Experiences", correction: "Fail", human_reasoning: "rationale here long enough" }],
      }),
    );

    const llm = vi.fn(async () => ({ text: JSON.stringify(sampleL3) }));
    const ctx = makeCtx(undefined as any, { projectId: "proj-z", llm: { call: llm } as any });
    await driveToCompletion(level3Step.run(new FormData(), ctx), "r", [{ action: "approve" }]);

    const sys = ((llm.mock.calls as any[])[0][0] as any).messages[0].content;
    expect(sys).toContain("INSTITUTIONAL MEMORY - LEVEL 3 HUMAN CORRECTIONS");
    expect(sys).toContain("Correction for 'Past Experiences': Fail");

    __setStoreRootForTests(null);
    rmSync(root, { recursive: true, force: true });
  });

  it("on approve, commits the staged precedents to the per-project store and returns", async () => {
    const root = mkdtempSync(join(tmpdir(), "l3-commit-"));
    __setStoreRootForTests(root);

    const llm = vi.fn(async () => ({ text: JSON.stringify(sampleL3) }));
    const ctx = makeCtx(undefined as any, { projectId: "proj-commit", llm: { call: llm } as any });
    ctx.staged.level_3_precedents.push({
      target: "Past Experiences",
      correction: "Fail",
      human_reasoning: "Already-staged by prior override",
      s_no: 1,
    });

    await driveToCompletion(level3Step.run(new FormData(), ctx), "r", [{ action: "approve" }]);

    expect(existsSync(join(root, "proj-commit.json"))).toBe(true);
    const reloaded = await loadPrecedents("proj-commit");
    expect(reloaded.level_3_precedents).toHaveLength(1);
    expect(reloaded.level_3_precedents[0]?.target).toBe("Past Experiences");

    __setStoreRootForTests(null);
    rmSync(root, { recursive: true, force: true });
  });
});
