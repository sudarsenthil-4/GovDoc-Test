import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { Level1Data, Level2Data, Classification } from "@/lib/usecases/cucp-reevals/types";
import { buildLevel2SystemPrompt, buildLevel2UserMessage } from "@/lib/usecases/cucp-reevals/prompts/level-2-classify";
import { type CucpL2Category } from "@/lib/usecases/cucp-reevals/rubric";
import { loadPrecedents } from "@/lib/usecases/cucp-reevals/memory/store";
import { l2OverrideToPrecedent, type L2OverridePayload } from "@/lib/usecases/cucp-reevals/memory/staged";
import { awaitLevelDecision } from "@/lib/runs/level-rendezvous";

type L2Decision =
  | { action: "approve" }
  | { action: "override-and-rerun"; override: L2OverridePayload };

export const level2Step: PipelineStep<FormData> = {
  id: "level2",
  label: "Classify facts (Level 2)",
  async *run(_formData, ctx) {
    yield { type: "progress", stage: "level2", pct: 0, message: "Starting Level 2 classification" } satisfies StepEvent;

    const l1 = (ctx.prior.level1 ?? {}) as Level1Data;
    const combinedFinancials = [
      `Cross-reference: ${l1.cross_reference_result ?? "NOT PROVIDED"}`,
      `Narrative PNW: ${l1.narrative_pnw ?? "NOT PROVIDED"}`,
      `Firm: ${l1.firm_name ?? "NOT PROVIDED"}`,
    ].join("\n");

    const persisted = await loadPrecedents(ctx.projectId);
    let parsed: Level2Data | null = null;

    while (true) {
      const all = [...persisted.level_2_precedents, ...ctx.staged.level_2_precedents];

      const provider: LlmProvider = "openai";
      const model = "gpt-4o";
      const rubric = ctx.rubric as { l2?: unknown } | undefined;
      const categories: readonly CucpL2Category[] | undefined =
        Array.isArray(rubric?.l2) ? (rubric!.l2 as readonly CucpL2Category[]) : undefined;
      const messages = [
        { role: "system" as const, content: buildLevel2SystemPrompt(all, categories) },
        { role: "user" as const, content: buildLevel2UserMessage(l1.extracted_facts ?? [], combinedFinancials) },
      ];

      yield { type: "progress", stage: "level2", pct: 50, message: "Calling AI provider" } satisfies StepEvent;

      let lastError: string | undefined;
      parsed = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        let response: { text: string };
        try {
          response = await ctx.llm.call({ provider, model, messages, temperature: 0, responseFormat: "json_object" });
        } catch (e) {
          ctx.log("level2 provider error", { error: e instanceof Error ? e.message : String(e) });
          yield { type: "error", stage: "level2", message: "AI Level 2 classification failed" } satisfies StepEvent;
          return;
        }
        try {
          parsed = JSON.parse(response.text) as Level2Data;
          break;
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
          if (attempt === 0) {
            yield { type: "progress", stage: "level2", pct: 50, message: "Retrying after JSON parse failure" } satisfies StepEvent;
          }
        }
      }

      if (!parsed) {
        ctx.log("level2 JSON parse failure", { error: lastError });
        yield { type: "error", stage: "level2", message: "AI Level 2 classification failed" } satisfies StepEvent;
        return;
      }

      yield { type: "stage-done", stage: "level2", data: parsed } satisfies StepEvent;
      yield {
        type: "needs-input",
        stage: "level2",
        level: 2,
        prompt: {
          kind: "approve-or-override",
          category: "level-2-classifications",
          proposed: { decision: "Classifications ready for review", rationale: "" },
        },
      } satisfies StepEvent;

      const decision = await awaitLevelDecision<L2Decision>(ctx.runId, 2);

      if (decision.action === "approve") {
        ctx.prior.level2 = parsed;
        return;
      }

      // override-and-rerun
      const classifications: readonly Classification[] = parsed.classifications ?? [];
      const matched = classifications.find((c) => c.fact_id === decision.override.fact_id);
      if (!matched) {
        ctx.log("level2 dangling override (fact_id no longer present)", {
          fact_id: decision.override.fact_id,
        });
      }
      ctx.staged.level_2_precedents.push(l2OverrideToPrecedent(decision.override, classifications));
      yield { type: "progress", stage: "level2", pct: 25, message: "Re-running with your correction…" } satisfies StepEvent;
      // loop continues
    }
  },
};
