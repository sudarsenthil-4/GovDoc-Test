import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { Level1Data, Level2Data, Level3Data, Criterion } from "@/lib/usecases/cucp-reevals/types";
import { buildLevel3SystemPrompt, buildLevel3UserMessage } from "@/lib/usecases/cucp-reevals/prompts/level-3-threshold";
import { type CucpL3Criterion } from "@/lib/usecases/cucp-reevals/rubric";
import { commitStagedPrecedents, loadPrecedents } from "@/lib/usecases/cucp-reevals/memory/store";
import { l3OverrideToPrecedent, type L3OverridePayload } from "@/lib/usecases/cucp-reevals/memory/staged";
import { awaitLevelDecision } from "@/lib/runs/level-rendezvous";

type L3Decision =
  | { action: "approve" }
  | { action: "override-and-rerun"; override: L3OverridePayload };

export const level3Step: PipelineStep<FormData> = {
  id: "level3",
  label: "Apply 7-criteria evaluation + human review",
  async *run(_formData, ctx) {
    yield { type: "progress", stage: "level3", pct: 0, message: "Starting Level 3 threshold evaluation" } satisfies StepEvent;

    const l1 = (ctx.prior.level1 ?? {}) as Level1Data;
    const l2 = (ctx.prior.level2 ?? {}) as Level2Data;
    const pnwResult = l1.cross_reference_result || "None";

    const persisted = await loadPrecedents(ctx.projectId);
    let parsed: Level3Data | null = null;

    while (true) {
      const all = [...persisted.level_3_precedents, ...ctx.staged.level_3_precedents];

      const provider: LlmProvider = "openai";
      const model = "gpt-4o";
      const rubric = ctx.rubric as { l3?: unknown } | undefined;
      const rubricCriteria: readonly CucpL3Criterion[] | undefined =
        Array.isArray(rubric?.l3) ? (rubric!.l3 as readonly CucpL3Criterion[]) : undefined;
      const messages = [
        { role: "system" as const, content: buildLevel3SystemPrompt(all, rubricCriteria) },
        { role: "user" as const, content: buildLevel3UserMessage(l2.classifications ?? [], l1.extracted_facts ?? [], pnwResult) },
      ];

      yield { type: "progress", stage: "level3", pct: 50, message: "Calling AI provider" } satisfies StepEvent;

      let lastError: string | undefined;
      parsed = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        let response: { text: string };
        try {
          response = await ctx.llm.call({ provider, model, messages, temperature: 0, responseFormat: "json_object" });
        } catch (e) {
          ctx.log("level3 provider error", { error: e instanceof Error ? e.message : String(e) });
          yield { type: "error", stage: "level3", message: "AI Level 3 threshold evaluation failed" } satisfies StepEvent;
          return;
        }
        try {
          parsed = JSON.parse(response.text) as Level3Data;
          break;
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
          if (attempt === 0) {
            yield { type: "progress", stage: "level3", pct: 50, message: "Retrying after JSON parse failure" } satisfies StepEvent;
          }
        }
      }

      if (!parsed) {
        ctx.log("level3 JSON parse failure", { error: lastError });
        yield { type: "error", stage: "level3", message: "AI Level 3 threshold evaluation failed" } satisfies StepEvent;
        return;
      }

      yield { type: "stage-done", stage: "level3", data: parsed } satisfies StepEvent;
      yield {
        type: "needs-input",
        stage: "level3",
        level: 3,
        prompt: {
          kind: "approve-or-override",
          category: "level-3-criteria",
          proposed: { decision: parsed.final_decision, rationale: parsed.certifier_comments },
        },
      } satisfies StepEvent;

      const decision = await awaitLevelDecision<L3Decision>(ctx.runId, 3);

      if (decision.action === "approve") {
        ctx.prior.level3 = parsed;
        await commitStagedPrecedents(ctx.projectId, ctx.staged);
        return;
      }

      // override-and-rerun
      const criteria: readonly Criterion[] = parsed.criteria ?? [];
      const sNo = Number(decision.override.s_no);
      const matched = criteria.find((c) => c.s_no === sNo);
      if (!matched) {
        ctx.log("level3 dangling override (s_no no longer present)", {
          s_no: sNo,
        });
      }
      ctx.staged.level_3_precedents.push(l3OverrideToPrecedent(decision.override, criteria));
      yield { type: "progress", stage: "level3", pct: 25, message: "Re-running with your correction…" } satisfies StepEvent;
      // loop continues
    }
  },
};
