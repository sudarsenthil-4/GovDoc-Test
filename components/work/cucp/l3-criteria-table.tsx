"use client";
import { cn } from "@/lib/utils";
import { STATUS_TONE, type RowStatus } from "../row/status-tone";
import type { Criterion } from "@/lib/usecases/cucp-reevals/types";

export type L3OverrideMap = Record<
  string,
  { verdict: string; request_info: "Yes" | "No"; reason: string }
>;

function verdictToStatus(verdict: string): RowStatus {
  const v = verdict.toLowerCase();
  if (v.includes("pass")) return "Pass";
  if (v.includes("fail")) return "Fail";
  if (v.includes("info") || v.includes("request")) return "Warning";
  return "N/A";
}

// Confidence scale in our pipeline is 0..1. Caltrans uses 0..10 with thresholds
// 8.0 / 5.0 (caltrans/app.py:1058-1064). Mirror proportionally: 0.80 / 0.50.
function confidenceTone(c: number | null | undefined): RowStatus {
  if (c == null || Number.isNaN(c)) return "N/A";
  if (c >= 0.8) return "Pass";
  if (c >= 0.5) return "Warning";
  return "Fail";
}

export function L3CriteriaTable({
  criteria,
  overrideMap,
}: {
  criteria: readonly Criterion[];
  overrideMap?: L3OverrideMap;
}): React.JSX.Element {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-2 whitespace-nowrap">Category</th>
            <th className="text-left p-2">Criterion</th>
            <th className="text-left p-2">Evidence Summary</th>
            <th className="text-left p-2">AI Reasoning</th>
            <th className="text-left p-2 whitespace-nowrap">Pass/Fail</th>
            <th className="text-left p-2 whitespace-nowrap">Need More Info?</th>
            <th className="text-left p-2 whitespace-nowrap">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {criteria.map((c) => {
            const ov = overrideMap?.[String(c.s_no)];
            const verdict = ov?.verdict ?? c.pass_fail ?? "—";
            const requestInfo: "Yes" | "No" = ov?.request_info ?? c.request_info;

            // request_info=Yes flips the row tone per caltrans cucp_reevals.py:207,
            // even when the underlying verdict reads as Pass/Fail.
            const verdictStatus: RowStatus =
              requestInfo === "Yes" ? "Warning" : verdictToStatus(verdict);
            const verdictToneCells = STATUS_TONE[verdictStatus];

            const infoStatus: RowStatus = requestInfo === "Yes" ? "Warning" : "N/A";
            const infoToneCells = STATUS_TONE[infoStatus];

            const confStatus = confidenceTone(c.confidence);
            const confToneCells = STATUS_TONE[confStatus];

            const evidence = c.evidence_summary?.trim() ? c.evidence_summary : "—";
            const reasoning = (ov?.reason ?? c.reasoning)?.trim()
              ? (ov?.reason ?? c.reasoning)
              : "—";

            return (
              <tr key={c.s_no} className={cn("border-t align-top", verdictToneCells.rowBorder)}>
                <td className="p-2 font-medium whitespace-nowrap">
                  {c.category || "—"}
                </td>
                <td className="p-2 max-w-xs">{c.qualification || "—"}</td>
                <td className="p-2 text-xs max-w-md break-words">{evidence}</td>
                <td className="p-2 text-xs italic text-muted-foreground max-w-lg break-words">
                  {reasoning}
                </td>
                <td
                  className={cn("p-2 font-semibold whitespace-nowrap", verdictToneCells.cell)}
                  data-verdict={verdictStatus.toLowerCase()}
                >
                  {verdict}
                </td>
                <td
                  className={cn("p-2 font-semibold whitespace-nowrap", infoToneCells.cell)}
                  data-request-info={requestInfo === "Yes" ? "yes" : "no"}
                >
                  {requestInfo}
                </td>
                <td
                  className={cn("p-2 font-mono whitespace-nowrap", confToneCells.cell)}
                  data-confidence-tone={confStatus.toLowerCase()}
                >
                  {c.confidence != null ? c.confidence.toFixed(2) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
