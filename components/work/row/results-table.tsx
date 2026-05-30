"use client";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";
import { STATUS_TONE, statusFromScore } from "./status-tone";

function scoreLabel(score: number): string {
  if (score === -1) return "N/A";
  if (score === 0) return "Error";
  return String(score);
}

export function ResultsTable({ results }: { results: EvaluationResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-background border-b">
          <tr>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Score</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Criteria Met</th>
            <th className="text-left p-2">Evidence</th>
            <th className="text-left p-2">Comments</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const status = statusFromScore(r.score);
            const tone = STATUS_TONE[status];
            return (
              <tr key={r.category} className={`border-b align-top ${tone.rowBorder}`}>
                <td className="p-2 font-medium">{r.category}</td>
                <td className={`p-2 font-medium ${tone.cell}`} data-row-status={status}>
                  {scoreLabel(r.score)}
                </td>
                <td className={`p-2 font-medium ${tone.cell}`} data-row-status-label={status}>
                  {status}
                </td>
                <td className="p-2 max-w-xs">{r.criteria_met}</td>
                <td className="p-2 max-w-xs">{r.evidence}</td>
                <td className="p-2 max-w-xs">{r.comments}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
