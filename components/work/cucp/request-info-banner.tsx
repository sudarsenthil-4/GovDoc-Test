"use client";

// Copy verbatim from caltrans/src/cucp_reevals.py:207. Do NOT paraphrase —
// this is the legal-decision string returned by the LLM when request_info=Yes.
const FINAL_DECISION_COPY =
  "Final decision: Not eligible at this time (pending additional information)";

export function RequestInfoBanner({ show }: { show: boolean }): React.JSX.Element | null {
  if (!show) return null;
  return (
    <div
      role="alert"
      className="mb-3 rounded-md border border-l-4 border-border border-l-muted-foreground bg-card p-3 text-sm font-medium text-foreground"
    >
      {FINAL_DECISION_COPY}
    </div>
  );
}
