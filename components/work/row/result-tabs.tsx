"use client";
import { Tabs } from "@base-ui/react/tabs";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";
import { ScoreSummary } from "./score-summary";
import { ExecSummary } from "./exec-summary";
import { ActionItems } from "./action-items";
import { ResultsTable } from "./results-table";
import { FindingsTable } from "./findings-table";

const TAB_TRIGGER =
  "px-4 py-2 text-sm font-semibold tracking-tight text-muted-foreground transition-colors data-[selected=true]:text-foreground data-[selected=true]:border-b-2 data-[selected=true]:border-primary";

function tabRender(props: React.ComponentPropsWithRef<"button">, state: { active: boolean }) {
  return <button {...props} data-selected={state.active ? "true" : undefined} />;
}

export function RowResultTabs({ results }: { results: EvaluationResult[] }) {
  // Jump straight to Detailed Findings when any category failed (score 0-2 or
  // explicit "Fail" status); otherwise land on the Executive Summary.
  const defaultTab = results.some(
    (r) => r.status.includes("Fail") || (r.score >= 0 && r.score < 3),
  )
    ? "detailed"
    : "exec";
  return (
    <div className="space-y-6">
      <ScoreSummary results={results} />
      <Tabs.Root defaultValue={defaultTab} className="rounded-2xl border border-border bg-card">
        <Tabs.List className="flex gap-1 border-b border-border px-4">
          <Tabs.Tab value="exec" className={TAB_TRIGGER} render={tabRender}>Executive Summary</Tabs.Tab>
          <Tabs.Tab value="detailed" className={TAB_TRIGGER} render={tabRender}>Detailed Findings</Tabs.Tab>
          <Tabs.Tab value="actions" className={TAB_TRIGGER} render={tabRender}>Action Items</Tabs.Tab>
        </Tabs.List>
        <div className="p-4">
          <Tabs.Panel value="exec" className="space-y-4">
            <ExecSummary results={results} />
          </Tabs.Panel>
          <Tabs.Panel value="detailed" className="space-y-6">
            <ResultsTable results={results} />
            <FindingsTable results={results} />
          </Tabs.Panel>
          <Tabs.Panel value="actions">
            <ActionItems results={results} />
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </div>
  );
}
