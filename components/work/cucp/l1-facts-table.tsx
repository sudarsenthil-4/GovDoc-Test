"use client";
import type { ExtractedFact } from "@/lib/usecases/cucp-reevals/types";

// Column headers verbatim from caltrans/app.py:722-728 (col_rename map):
//   id → Fact #, when → When, where → Where, who → Who, what → What,
//   why → Why, magnitude → Magnitude/Threshold,
//   demographic_flag → Demographics Checkbox, source_quote → Source Quote.
// Order also mirrors caltrans `col_rename` insertion order.
const HEADERS: ReadonlyArray<{ key: keyof ExtractedFact; label: string }> = [
  { key: "id", label: "Fact #" },
  { key: "when", label: "When" },
  { key: "where", label: "Where" },
  { key: "who", label: "Who" },
  { key: "what", label: "What" },
  { key: "why", label: "Why" },
  { key: "magnitude", label: "Magnitude/Threshold" },
  { key: "demographic_flag", label: "Demographics Checkbox" },
  { key: "source_quote", label: "Source Quote" },
];

function renderCell(fact: ExtractedFact, key: keyof ExtractedFact): string {
  const v = fact[key];
  if (key === "demographic_flag") {
    return v === true ? "Yes" : "";
  }
  if (typeof v === "string" && v.trim().length > 0) return v;
  return "—";
}

export function L1FactsTable({
  facts,
}: {
  facts: readonly ExtractedFact[];
}): React.JSX.Element {
  if (facts.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
        No facts extracted.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            {HEADERS.map((h) => (
              <th key={h.key} className="text-left p-2 whitespace-nowrap">
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {facts.map((f) => (
            <tr key={f.id} className="border-t align-top">
              {HEADERS.map((h) => (
                <td
                  key={h.key}
                  className={
                    h.key === "source_quote"
                      ? "p-2 italic text-muted-foreground max-w-md break-words"
                      : h.key === "id"
                        ? "p-2 font-mono whitespace-nowrap"
                        : "p-2"
                  }
                >
                  {renderCell(f, h.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
