import { describe, it, expect, vi, beforeEach } from "vitest";
import { level2Step } from "./level-2-step";
import { resolveLevelDecision, __clearLevelRendezvous } from "@/lib/runs/level-rendezvous";
import { __setStoreRootForTests } from "@/lib/usecases/cucp-reevals/memory/store";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { StepContext } from "@/lib/usecases/types";

const sampleL2 = {
  classifications: [{ fact_id: "fact_1", classification: "Social Disadvantage", summary: "X", reasoning: "Y" }],
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
    if (ev.type === "needs-input" && ev.stage === "level2") {
      const decision = decisions[nextDecisionIdx++] ?? { action: "approve" };
      // Resolve on next tick so the await registers first
      queueMicrotask(() => resolveLevelDecision(runId, 2, decision));
    }
  }
  return events;
}

beforeEach(() => __clearLevelRendezvous());

describe("level2Step", () => {
  it("emits stage-done with parsed Level2Data, then exits on approve", async () => {
    const ctx = makeCtx(async () => ({ text: JSON.stringify(sampleL2) }));
    const events = await driveToCompletion(level2Step.run(new FormData(), ctx), "r", [{ action: "approve" }]);
    const stageDones = events.filter((e) => e.type === "stage-done");
    expect(stageDones).toHaveLength(1);
    expect(stageDones[0].data.classifications).toHaveLength(1);
    expect((ctx.prior as any).level2).toBeDefined();
  });

  it("retries once on JSON parse failure and succeeds", async () => {
    let calls = 0;
    const ctx = makeCtx(async () => {
      calls++;
      return calls === 1 ? { text: "not json" } : { text: JSON.stringify(sampleL2) };
    });
    const events = await driveToCompletion(level2Step.run(new FormData(), ctx), "r", [{ action: "approve" }]);
    const done = events.find((e) => e.type === "stage-done");
    expect(done).toBeDefined();
    expect(calls).toBe(2);
  });

  it("emits error and logs internal detail when both retries fail", async () => {
    const ctx = makeCtx(async () => ({ text: "still not json" }));
    const events: any[] = [];
    for await (const ev of level2Step.run(new FormData(), ctx)) events.push(ev);
    const err = events.find((e) => e.type === "error");
    expect(err.message).toBe("AI Level 2 classification failed");
    expect(err.message).not.toContain("JSON");
    expect(ctx.log).toHaveBeenCalled();
  });

  it("emits error if provider rejects", async () => {
    const ctx = makeCtx(async () => { throw new Error("boom"); });
    const events: any[] = [];
    for await (const ev of level2Step.run(new FormData(), ctx)) events.push(ev);
    const err = events.find((e) => e.type === "error");
    expect(err.message).toBe("AI Level 2 classification failed");
  });

  it("override-and-rerun: appends a staged precedent and re-runs with it in the prompt", async () => {
    const calls: string[] = [];
    const llm = vi.fn(async ({ messages }: any) => {
      const sys = messages[0].content;
      calls.push(sys);
      const isSecond = calls.length === 2;
      const classification = isSecond ? "Social Disadvantage" : "Ordinary Business Risk";
      return {
        text: JSON.stringify({
          classifications: [{ fact_id: "fact_1", classification, summary: "x", reasoning: "y" }],
        }),
      };
    });
    const ctx = makeCtx(undefined as any, { llm: { call: llm } as any });

    const events = await driveToCompletion(level2Step.run(new FormData(), ctx), "r", [
      { action: "override-and-rerun", override: { fact_id: "fact_1", new_category: "Social Disadvantage", reason: "Affidavit cites bias plainly enough." } },
      { action: "approve" },
    ]);

    expect(llm).toHaveBeenCalledTimes(2);
    expect(calls[1]).toContain("INSTITUTIONAL MEMORY - LEVEL 2 HUMAN CORRECTIONS");
    expect(calls[1]).toContain("'Ordinary Business Risk' -> Classify as: 'Social Disadvantage'");
    expect((ctx.prior as any).level2.classifications[0].classification).toBe("Social Disadvantage");
    expect(ctx.staged.level_2_precedents).toHaveLength(1);
    expect(events.filter((e) => e.type === "stage-done")).toHaveLength(2);
  });

  it("dangling override: fact_id no longer present logs a warning and proceeds", async () => {
    const llm = vi.fn(async () => ({
      text: JSON.stringify({ classifications: [{ fact_id: "fact_OTHER", classification: "X", summary: "x", reasoning: "y" }] }),
    }));
    const ctx = makeCtx(undefined as any, { llm: { call: llm } as any });
    await driveToCompletion(level2Step.run(new FormData(), ctx), "r", [
      { action: "override-and-rerun", override: { fact_id: "fact_MISSING", new_category: "Social Disadvantage", reason: "this fact does not exist anymore" } },
      { action: "approve" },
    ]);
    expect(ctx.log).toHaveBeenCalledWith(
      "level2 dangling override (fact_id no longer present)",
      expect.objectContaining({ fact_id: "fact_MISSING" }),
    );
    expect(ctx.staged.level_2_precedents).toHaveLength(1); // still staged, not dropped
  });

  it("loads persisted L2 precedents from the project store", async () => {
    const root = mkdtempSync(join(tmpdir(), "l2-precedents-"));
    __setStoreRootForTests(root);
    writeFileSync(
      join(root, "proj-y.json"),
      JSON.stringify({
        level_1_precedents: [],
        level_2_precedents: [{ target: "Some scenario", correction: "Insufficient Evidence", human_reasoning: "rationale here long enough" }],
        level_3_precedents: [],
      }),
    );

    const llm = vi.fn(async () => ({ text: JSON.stringify(sampleL2) }));
    const ctx = makeCtx(undefined as any, { projectId: "proj-y", llm: { call: llm } as any });
    await driveToCompletion(level2Step.run(new FormData(), ctx), "r", [{ action: "approve" }]);

    const sys = ((llm.mock.calls as any[])[0][0] as any).messages[0].content;
    expect(sys).toContain("INSTITUTIONAL MEMORY - LEVEL 2 HUMAN CORRECTIONS");
    expect(sys).toContain("'Some scenario' -> Classify as: 'Insufficient Evidence'");

    __setStoreRootForTests(null);
    rmSync(root, { recursive: true, force: true });
  });
});
