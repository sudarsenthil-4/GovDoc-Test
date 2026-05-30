"use client";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

type Priority = "HIGH" | "MEDIUM" | "LOW";

const PRIORITY_BY_SCORE: Record<number, Priority | "NONE"> = {
  1: "HIGH",
  2: "HIGH",
  3: "MEDIUM",
  4: "LOW",
  5: "NONE",
};

const ACTION_TEMPLATES: Record<string, string> = {
  "Certificate of Appraiser": "Obtain missing certificate(s) for appraiser(s) listed on Title Page. Ensure all appraisers sign the Certificate of Appraiser section.",
  "Income Approach (If used)": "Document why Income Approach is not applicable, or complete full Income Approach analysis with market data.",
  "Cost Approach (If Used)": "Add page number and version number for cost source (e.g., Marshall & Swift). Verify depreciation calculations.",
  "Comparable Data Sheets": "Replace custom data sheets with official Caltrans RW 7-11 or RW 7-11A forms. Add concurring statement from another appraiser.",
  "Comparable Map Sheet": "Update map to use outlines (red for subject, orange for sales, green for listings) instead of colored dots/pins. Add north arrow.",
  "Subject Assessor Map": "Ensure subject parcel is highlighted in red. Add caption explaining the map.",
  "Subject Photos": "Add more photos with captions. Denote Right of Way lines and acquisition areas on photos. Include dates.",
  "Area Description": "Add employment data, market trends, and current uses. Include census data and population statistics.",
  "Senior Review Certificate": "Update form to current revision. Verify all required signatures are present.",
  "Title Page": "Update form to current revision (REV). Verify all delegation signatures.",
  "RW 7-9": "Update to current form revision. Ensure all line items are complete and mathematically correct.",
  "Scope of Work": "Expand scope to include all required elements: client, users, intended use, value definition, effective dates.",
  "Sales Comparison Approach (If used)": "Add detailed explanation of adjustments and sources. Evaluate strengths/weaknesses of comparables.",
  "Reconciliation": "Provide detailed evaluation of each approach used. Explain why any approach was not used.",
  "The Acquisition - Land": "Provide rationalization for percentages used for easements/TCEs. Include market-derived data.",
  "Improvements": "Add line items for improvements with no value. Verify all impacted improvements are listed.",
  "Delegations": "Verify all required signatures are present and follow correct delegation chain.",
};

const PRIORITY_ORDER: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const PRIORITY_CLASS: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-blue-100 text-blue-800",
};

type ActionItem = {
  category: string;
  currentScore: number;
  priority: Priority;
  text: string;
};

function buildActionItems(results: EvaluationResult[]): ActionItem[] {
  const items: ActionItem[] = [];
  for (const r of results) {
    if (r.score === -1 || r.score === 5) continue;
    const priority = PRIORITY_BY_SCORE[r.score];
    if (!priority || priority === "NONE") continue;

    const template = ACTION_TEMPLATES[r.category]
      ?? `Review ${r.category} and address deficiencies to meet Score 5 requirements.`;
    const evidence = (r.evidence ?? "").toString();
    const isCritical =
      r.score <= 2 && (evidence.includes("NOT FOUND") || evidence.toLowerCase().includes("missing"));
    const text = isCritical
      ? `CRITICAL: ${template} Evidence: ${evidence.slice(0, 200)}`
      : template;

    items.push({ category: r.category, currentScore: r.score, priority, text });
  }
  items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  return items;
}

export function ActionItems({ results }: { results: EvaluationResult[] }) {
  const items = buildActionItems(results);
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No action items — all categories scored 5 or N/A.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-background border-b">
          <tr>
            <th className="text-left p-2">Priority</th>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Current</th>
            <th className="text-left p-2">Target</th>
            <th className="text-left p-2">Action item</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.category} className="border-b align-top">
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_CLASS[it.priority]}`}>
                  {it.priority}
                </span>
              </td>
              <td className="p-2 font-medium">{it.category}</td>
              <td className="p-2">{it.currentScore}</td>
              <td className="p-2">5</td>
              <td className="p-2">{it.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
