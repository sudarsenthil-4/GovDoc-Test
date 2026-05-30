import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { level1Step } from "./level-1-step";
import type { StepContext, StepEvent } from "@/lib/usecases/types";
import { __setStoreRootForTests } from "@/lib/usecases/cucp-reevals/memory/store";
import { resolveLevelDecision, __clearLevelRendezvous } from "@/lib/runs/level-rendezvous";

const sampleL1 = {
  firm_name: "Acme",
  cross_reference_result: "1500000",
  narrative_pnw: "NOT PROVIDED",
  extracted_facts: [{ id: "fact_1", when: "2025", where: "CA", who: "Owner", what: "lost contract", why: "discrimination", magnitude: "$50k", demographic_flag: true, source_quote: "..." }],
};

let nextRunId = 0;
function makeCtx(callImpl: any, projectId = "_test"): StepContext {
  nextRunId++;
  return {
    userId: "u", projectId, runId: `r-${nextRunId}`,
    prior: { extract: { narrativeText: "body", firmRevenues: {} } },
    staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
    llm: { call: vi.fn(callImpl) } as any,
    abortSignal: new AbortController().signal, log: vi.fn(),
  };
}

// Walk the generator. When `needs-input` shows up, call resolver(ctx, eventCount)
// which decides what to feed back. This lets a test simulate one or more
// override + approve cycles without sleeping on real time.
async function runWithDecisions(
  ctx: StepContext,
  resolver: (
    ev: Extract<StepEvent, { type: "needs-input" }>,
    decisionsSoFar: number,
  ) => unknown | null,
) {
  const events: StepEvent[] = [];
  let decisions = 0;
  for await (const ev of level1Step.run(new FormData(), ctx)) {
    events.push(ev);
    if (ev.type === "needs-input") {
      const d = resolver(ev, decisions);
      decisions++;
      if (d != null) {
        // Resolve in next microtask so the generator has registered the waiter.
        queueMicrotask(() => {
          resolveLevelDecision(ctx.runId, 1, d);
        });
      }
    }
  }
  return events;
}

const autoApprove = () => ({ action: "approve" } as const);

beforeEach(() => __clearLevelRendezvous());
afterEach(() => __clearLevelRendezvous());

describe("level1Step", () => {
  it("emits stage-done with parsed Level1Data on first-try success", async () => {
    const ctx = makeCtx(async () => ({ text: JSON.stringify(sampleL1) }));
    const events = await runWithDecisions(ctx, autoApprove);
    const done = events.find((e) => e.type === "stage-done");
    expect(done).toBeDefined();
    expect((done!.data as { firm_name: string }).firm_name).toBe("Acme");
    expect((done!.data as { extracted_facts: unknown[] }).extracted_facts).toHaveLength(1);
  });

  it("retries once on JSON parse failure and succeeds", async () => {
    let calls = 0;
    const ctx = makeCtx(async () => {
      calls++;
      return calls === 1 ? { text: "not json" } : { text: JSON.stringify(sampleL1) };
    });
    const events = await runWithDecisions(ctx, autoApprove);
    const done = events.find((e) => e.type === "stage-done");
    expect(done).toBeDefined();
    expect(calls).toBe(2);
  });

  it("emits error and logs internal detail when both retries fail", async () => {
    const ctx = makeCtx(async () => ({ text: "still not json" }));
    // Errors short-circuit before needs-input — resolver shouldn't be called.
    const events = await runWithDecisions(ctx, () => null);
    const err = events.find((e) => e.type === "error") as Extract<StepEvent, { type: "error" }>;
    expect(err.message).toBe("AI Level 1 fact extraction failed");
    expect(err.message).not.toContain("JSON");
    expect(ctx.log).toHaveBeenCalled();
  });

  it("emits error if provider rejects (network failure)", async () => {
    const ctx = makeCtx(async () => { throw new Error("upstream-credential-leak-info"); });
    const events = await runWithDecisions(ctx, () => null);
    const err = events.find((e) => e.type === "error") as Extract<StepEvent, { type: "error" }>;
    expect(err.message).toBe("AI Level 1 fact extraction failed");
    expect(err.message).not.toContain("upstream-credential");
  });

  it("includes per-project L1 precedents in the system prompt", async () => {
    const root = mkdtempSync(join(tmpdir(), "l1-precedents-"));
    __setStoreRootForTests(root);
    writeFileSync(
      join(root, "proj-x.json"),
      JSON.stringify({
        level_1_precedents: [
          { target: "Some target", correction: "Some correction", human_reasoning: "rationale" },
        ],
        level_2_precedents: [],
        level_3_precedents: [],
      }),
    );

    const llmCall = vi.fn(async () => ({ text: JSON.stringify(sampleL1) }));
    const ctx: StepContext = {
      userId: "u", projectId: "proj-x", runId: "rp-1",
      prior: { extract: { narrativeText: "body", firmRevenues: {} } },
      staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
      llm: { call: llmCall } as any,
      abortSignal: new AbortController().signal, log: vi.fn(),
    };

    await runWithDecisions(ctx, autoApprove);

    expect(llmCall).toHaveBeenCalledTimes(1);
    const calls = llmCall.mock.calls as any[];
    const sys = calls[0][0].messages[0].content;
    expect(sys).toContain("INSTITUTIONAL MEMORY - LEVEL 1 HUMAN CORRECTIONS:");
    expect(sys).toContain("If you see 'Some target', apply correction: 'Some correction'");

    __setStoreRootForTests(null);
    rmSync(root, { recursive: true, force: true });
  });

  describe("evaluate-pause loop", () => {
    it("override-fact stages a precedent and re-runs L1", async () => {
      let calls = 0;
      const ctx = makeCtx(async () => {
        calls++;
        return { text: JSON.stringify(sampleL1) };
      });

      await runWithDecisions(ctx, (_ev, n) => {
        if (n === 0) {
          return {
            action: "override-fact",
            override: { kind: "fact-field", fact_id: "fact_1", field: "When", corrected_value: "2020", reason: "narrative says 2020 plainly" },
          };
        }
        return autoApprove();
      });

      expect(calls).toBe(2);
      expect(ctx.staged.level_1_precedents).toHaveLength(1);
      expect(ctx.staged.level_1_precedents[0]!.target).toBe("Fact fact_1: When");
      expect(ctx.staged.l1_action_log).toEqual(["precedent"]);
    });

    it("override-field patches firm_name without making a precedent and re-runs L1", async () => {
      let calls = 0;
      const ctx = makeCtx(async () => {
        calls++;
        return { text: JSON.stringify({ ...sampleL1, firm_name: "Wrong Co" }) };
      });

      const events = await runWithDecisions(ctx, (_ev, n) => {
        if (n === 0) {
          return {
            action: "override-field",
            override: { field: "firm_name", corrected_value: "Acme, LLC.", reason: "matches incorporation documents" },
          };
        }
        return autoApprove();
      });

      expect(calls).toBe(2);
      expect(ctx.staged.level_1_precedents).toHaveLength(0);
      expect(ctx.staged.l1_field_overrides?.firm_name?.value).toBe("Acme, LLC.");
      expect(ctx.staged.l1_action_log).toEqual(["firm_name"]);

      // Final stage-done should reflect the patched firm_name (post-LLM patch applied).
      const stageDones = events.filter((e) => e.type === "stage-done");
      const last = stageDones[stageDones.length - 1] as Extract<StepEvent, { type: "stage-done" }>;
      expect((last.data as { firm_name: string }).firm_name).toBe("Acme, LLC.");
    });

    it("undo pops the most recent staged item (LIFO across precedent + field-overrides)", async () => {
      const ctx = makeCtx(async () => ({ text: JSON.stringify(sampleL1) }));

      await runWithDecisions(ctx, (_ev, n) => {
        if (n === 0) {
          return {
            action: "override-fact",
            override: { kind: "fact-field", fact_id: "fact_1", field: "Who", corrected_value: "Owner", reason: "narrative confirms it was the owner" },
          };
        }
        if (n === 1) {
          return {
            action: "override-field",
            override: { field: "narrative_pnw", corrected_value: "1.2M", reason: "page 2 says 1.2M" },
          };
        }
        if (n === 2) {
          return { action: "undo" };
        }
        return autoApprove();
      });

      // The narrative_pnw field-override was added second → undo pops it,
      // leaving the fact precedent intact.
      expect(ctx.staged.level_1_precedents).toHaveLength(1);
      expect(ctx.staged.l1_field_overrides?.narrative_pnw).toBeUndefined();
      expect(ctx.staged.l1_action_log).toEqual(["precedent"]);
    });

    it("clear resets both staged collections and the action log", async () => {
      const ctx = makeCtx(async () => ({ text: JSON.stringify(sampleL1) }));

      await runWithDecisions(ctx, (_ev, n) => {
        if (n === 0) {
          return {
            action: "override-fact",
            override: { kind: "fact-field", fact_id: "fact_1", field: "What", corrected_value: "loan", reason: "narrative explicitly says loan" },
          };
        }
        if (n === 1) {
          return { action: "clear" };
        }
        return autoApprove();
      });

      expect(ctx.staged.level_1_precedents).toEqual([]);
      expect(ctx.staged.l1_field_overrides).toEqual({});
      expect(ctx.staged.l1_action_log).toEqual([]);
    });
  });
});
