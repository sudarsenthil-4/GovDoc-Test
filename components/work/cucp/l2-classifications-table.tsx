"use client";

// Verbatim from caltrans/app.py:954. These are 49 CFR §26.67 legal terms —
// DO NOT paraphrase. "Keep Current (Fix Reasoning Only)" is intentionally
// included so an analyst can preserve the AI's category and only update the
// rationale text.
export const L2_LEGAL_CATEGORIES = [
  "Keep Current (Fix Reasoning Only)",
  "Social Disadvantage",
  "Economic Disadvantage",
  "Institutional/Systemic Barrier",
  "Ordinary Business Risk",
  "Insufficient Evidence",
] as const;

export type L2Row = {
  fact_id: string;
  category: string;
  summary: string;
  ai_reasoning: string;
};

export type L2OverridePayload = {
  fact_id: string;
  new_category: string;
  reason: string;
};

export function L2ClassificationsTable({
  rows,
}: {
  rows: readonly L2Row[];
}): React.JSX.Element {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-2 whitespace-nowrap">Fact #</th>
            <th className="text-left p-2 whitespace-nowrap">Legal Category</th>
            <th className="text-left p-2">Summary</th>
            <th className="text-left p-2">AI Reasoning</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.fact_id} className="border-t align-top">
              <td className="p-2 font-mono whitespace-nowrap">{r.fact_id}</td>
              <td className="p-2 font-medium whitespace-nowrap">
                {r.category || "—"}
              </td>
              <td className="p-2 max-w-md break-words">{r.summary || "—"}</td>
              <td className="p-2 italic text-muted-foreground max-w-md break-words">
                {r.ai_reasoning || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
