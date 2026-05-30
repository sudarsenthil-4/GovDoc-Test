// @vitest-environment node

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { level2Step } from "@/lib/usecases/cucp-reevals/pipeline/level-2-step";
import { __setStoreRootForTests } from "@/lib/usecases/cucp-reevals/memory/store";
import { resolveLevelDecision, __clearLevelRendezvous } from "@/lib/runs/level-rendezvous";
import type { StepContext, StepEvent } from "@/lib/usecases/types";
import { EMPTY_PRECEDENTS } from "@/lib/usecases/cucp-reevals/memory/precedents";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "cucp-loop-"));
  __setStoreRootForTests(root);
  __clearLevelRendezvous();
});

afterEach(() => {
  __setStoreRootForTests(null);
  __clearLevelRendezvous();
  rmSync(root, { recursive: true, force: true });
});

describe("CUCP precedents override loop integration", () => {
  it("override → re-eval includes the override; approve → exits with the new data", async () => {
    const calls: string[] = [];
    const llm = {
      call: vi.fn(async ({ messages }: { messages: { role: string; content: string }[] }) => {
        const sys = messages.find((m) => m.role === "system")?.content ?? "";
        calls.push(sys);
        const isSecond = calls.length === 2;
        const classification = isSecond ? "Social Disadvantage" : "Ordinary Business Risk";
        return {
          text: JSON.stringify({
            classifications: [
              { fact_id: "fact_1", classification, summary: "x", reasoning: "y" },
            ],
          }),
        };
      }),
    };

    const ctx: StepContext = {
      userId: "tester",
      projectId: "project-loop",
      runId: "run-loop",
      prior: {
        level1: {
          extracted_facts: [{ id: "fact_1" }],
          firm_name: "Acme",
          cross_reference_result: "X",
          narrative_pnw: "Y",
        },
      },
      staged: {
        level_1_precedents: [...EMPTY_PRECEDENTS.level_1_precedents],
        level_2_precedents: [...EMPTY_PRECEDENTS.level_2_precedents],
        level_3_precedents: [...EMPTY_PRECEDENTS.level_3_precedents],
      },
      llm: llm as never,
      abortSignal: new AbortController().signal,
      log: () => {},
    };

    const events: StepEvent[] = [];
    const gen = level2Step.run(undefined as never, ctx);

    const driver = (async () => {
      let stageDoneCount = 0;
      for await (const ev of gen) {
        events.push(ev);
        if (ev.type === "stage-done" && ev.stage === "level2") {
          stageDoneCount++;
        }
        if (ev.type === "needs-input" && ev.stage === "level2") {
          if (stageDoneCount === 1) {
            queueMicrotask(() =>
              resolveLevelDecision("run-loop", 2, {
                action: "override-and-rerun",
                override: {
                  fact_id: "fact_1",
                  new_category: "Social Disadvantage",
                  reason: "Affidavit cites bias plainly enough.",
                },
              }),
            );
          } else {
            queueMicrotask(() => resolveLevelDecision("run-loop", 2, { action: "approve" }));
          }
        }
      }
    })();

    await driver;

    expect(llm.call).toHaveBeenCalledTimes(2);
    expect(calls[1]).toContain("Social Disadvantage");
    expect(calls[1]).toContain("INSTITUTIONAL MEMORY - LEVEL 2 HUMAN CORRECTIONS");

    const finalLevel2 = ctx.prior.level2 as { classifications: { classification: string }[] };
    expect(finalLevel2.classifications[0]?.classification).toBe("Social Disadvantage");
    expect(ctx.staged.level_2_precedents).toHaveLength(1);
  });
});
