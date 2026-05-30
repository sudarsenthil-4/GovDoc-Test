"use client";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";
import { STATUS_TONE, statusFromScore } from "./status-tone";

export function ExecSummary({ results }: { results: EvaluationResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-background border-b">
          <tr>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Score</th>
            <th className="text-left p-2">Status</th>
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
                <td className="p-2">{r.score === -1 ? "N/A" : r.score}</td>
                <td className={`p-2 font-medium ${tone.cell}`} data-status={status}>
                  {status}
                </td>
                <td className="p-2 max-w-md">{r.comments}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
