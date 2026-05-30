"use client";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

export function ScoreSummary({ results }: { results: EvaluationResult[] }) {
  const counts = { pass: 0, warning: 0, fail: 0, na: 0, error: 0 };
  let scoreSum = 0;
  let scoreCount = 0;
  for (const r of results) {
    if (r.status === "✅ Pass") counts.pass++;
    else if (r.status === "⚠️ Warning") counts.warning++;
    else if (r.status === "❌ Fail") counts.fail++;
    else if (r.status === "⚪ N/A") counts.na++;
    else if (r.status === "❌ Error") counts.error++;
    if (r.score >= 1 && r.score <= 5) {
      scoreSum += r.score;
      scoreCount++;
    }
  }
  const avg = scoreCount > 0 ? (scoreSum / scoreCount).toFixed(2) : "—";
  return (
    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
      <Stat label="Pass" value={counts.pass} />
      <Stat label="Warning" value={counts.warning} />
      <Stat label="Fail" value={counts.fail} />
      <Stat label="N/A" value={counts.na} />
      <Stat label="Error" value={counts.error} />
      <Stat label="Avg" value={avg} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border rounded p-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
