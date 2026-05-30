import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { Level1Data, L1Decision, L1FieldKey } from "@/lib/usecases/cucp-reevals/types";
import { buildLevel1SystemPrompt, buildLevel1UserMessage } from "@/lib/usecases/cucp-reevals/prompts/level-1-extract";
import { loadPrecedents } from "@/lib/usecases/cucp-reevals/memory/store";
import { l1OverrideToPrecedent } from "@/lib/usecases/cucp-reevals/memory/staged";
import { awaitLevelDecision } from "@/lib/runs/level-rendezvous";

export const level1Step: PipelineStep<FormData> = {
  id: "level1",
  label: "Extract facts (Level 1)",
  async *run(_formData, ctx) {
    yield { type: "progress", stage: "level1", pct: 0, message: "Starting Level 1 fact extraction" } satisfies StepEvent;

    const prior = (ctx.prior.extract ?? {}) as { narrativeText?: string; firmRevenues?: Record<string, unknown> };
    const narrativeText = prior.narrativeText ?? "";
    const firmRevenues = prior.firmRevenues ?? {};
    const persisted = await loadPrecedents(ctx.projectId);

    // Lazy-init the L1-only staged channels — older test fixtures and the run
    // route both rely on these being defaulted here.
    if (!ctx.staged.l1_field_overrides) ctx.staged.l1_field_overrides = {};
    if (!ctx.staged.l1_action_log) ctx.staged.l1_action_log = [];

    const provider: LlmProvider = "openai";
    const model = "gpt-4o";

    while (true) {
      const allPrecedents = [...persisted.level_1_precedents, ...ctx.staged.level_1_precedents];

      const messages = [
        { role: "system" as const, content: buildLevel1SystemPrompt(firmRevenues as any, allPrecedents) },
        { role: "user" as const, content: buildLevel1UserMessage(narrativeText) },
      ];

      yield { type: "progress", stage: "level1", pct: 50, message: "Calling AI provider" } satisfies StepEvent;

      let parsed: Level1Data | null = null;
      let lastError: string | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        let response: { text: string };
        try {
          response = await ctx.llm.call({ provider, model, messages, temperature: 0, responseFormat: "json_object" });
        } catch (e) {
          ctx.log("level1 provider error", { error: e instanceof Error ? e.message : String(e) });
          yield { type: "error", stage: "level1", message: "AI Level 1 fact extraction failed" } satisfies StepEvent;
          return;
        }
        try {
          parsed = JSON.parse(response.text) as Level1Data;
          break;
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
          if (attempt === 0) {
            yield { type: "progress", stage: "level1", pct: 50, message: "Retrying after JSON parse failure" } satisfies StepEvent;
          }
        }
      }
      if (!parsed) {
        ctx.log("level1 JSON parse failure", { error: lastError });
        yield { type: "error", stage: "level1", message: "AI Level 1 fact extraction failed" } satisfies StepEvent;
        return;
      }

      // Apply field-overrides on top of parsed (post-LLM patches; matches caltrans analyst_overrides).
      const fieldOverrides = ctx.staged.l1_field_overrides;
      if (fieldOverrides.firm_name) parsed.firm_name = fieldOverrides.firm_name.value;
      if (fieldOverrides.narrative_pnw) parsed.narrative_pnw = fieldOverrides.narrative_pnw.value;

      yield { type: "stage-done", stage: "level1", data: parsed } satisfies StepEvent;
      yield {
        type: "needs-input",
        stage: "level1",
        level: 1,
        prompt: { kind: "approve-or-override", category: "level-1-facts", proposed: { decision: "Facts ready for review", rationale: "" } },
      } satisfies StepEvent;

      const decision = await awaitLevelDecision<L1Decision>(ctx.runId, 1);

      switch (decision.action) {
        case "approve":
          ctx.prior.level1 = parsed;
          return;

        case "override-fact":
        case "override-incident":
          ctx.staged.level_1_precedents.push(l1OverrideToPrecedent(decision.override));
          ctx.staged.l1_action_log.push("precedent");
          break;

        case "override-field": {
          const k = decision.override.field as L1FieldKey;
          ctx.staged.l1_field_overrides[k] = {
            value: decision.override.corrected_value,
            reason: decision.override.reason,
          };
          ctx.staged.l1_action_log.push(k);
          break;
        }

        case "undo": {
          const last = ctx.staged.l1_action_log.pop();
          if (last === "precedent") {
            ctx.staged.level_1_precedents.pop();
          } else if (last === "firm_name" || last === "narrative_pnw") {
            delete ctx.staged.l1_field_overrides[last];
          }
          break;
        }

        case "clear":
          ctx.staged.level_1_precedents.length = 0;
          ctx.staged.l1_field_overrides = {};
          ctx.staged.l1_action_log.length = 0;
          break;
      }

      yield { type: "progress", stage: "level1", pct: 25, message: "Re-running Level 1 with your correction…" } satisfies StepEvent;
    }
  },
};
