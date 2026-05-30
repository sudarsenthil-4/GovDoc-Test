"use client";
import { cn } from "@/lib/utils";
import type { Level, Precedent } from "@/lib/usecases/cucp-reevals/memory/precedents";

export function PrecedentsAdminTable({
  level,
  precedents,
  onDelete,
}: {
  level: Level;
  precedents: readonly Precedent[];
  onDelete: (index: number) => void;
}): React.JSX.Element {
  if (precedents.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
        No precedents committed for level {level}.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-2">Target</th>
            <th className="text-left p-2">Correction</th>
            <th className="text-left p-2">Reasoning</th>
            <th className="text-left p-2">Link</th>
            <th className="text-left p-2"></th>
          </tr>
        </thead>
        <tbody>
          {precedents.map((p, i) => (
            <tr key={i} className="border-t align-top">
              <td className="p-2 max-w-xs">{p.target}</td>
              <td className="p-2 font-medium">{p.correction}</td>
              <td className="p-2 text-xs text-muted-foreground max-w-md break-words">{p.human_reasoning}</td>
              <td className="p-2 font-mono text-xs">
                {level === 2 ? (p.fact_id ?? "—") : level === 3 ? (p.s_no != null ? `s_no=${p.s_no}` : "—") : "—"}
              </td>
              <td className="p-2">
                <button
                  type="button"
                  onClick={() => onDelete(i)}
                  className={cn(
                    "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-medium",
                    "text-destructive hover:bg-destructive/20",
                  )}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
