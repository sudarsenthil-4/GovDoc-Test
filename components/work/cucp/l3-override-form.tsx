"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Caltrans `app.py:1129` lists 4 dropdown options: "Keep Current (Fix Reasoning Only)",
// "Pass", "Fail", "Request Additional Information". We omit "Keep Current" because
// the form-below-table pattern (vs caltrans's per-row inline edit) treats the absence
// of an override entry as "keep current" — i.e. the user simply doesn't add a row.
const VERDICTS = ["Pass", "Fail", "Request Additional Information"] as const;
type Verdict = (typeof VERDICTS)[number];

export type L3OverridePayload = {
  s_no: string;
  verdict: "Pass" | "Fail";
  request_info: "Yes" | "No";
  reason: string;
};

const SELECT_CLASS =
  "h-9 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 text-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-cream-soft)] focus:border-[var(--color-govdoc-primary)] focus:bg-[var(--color-paper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]";

const TEXTAREA_CLASS =
  "mt-1 block w-full rounded-lg border border-input bg-muted/30 p-2 text-sm transition-colors focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none";

export function L3OverrideForm({
  criteria,
  onSave,
  disabled = false,
}: {
  criteria: readonly { s_no: string; criterion: string }[];
  onSave: (payload: L3OverridePayload) => void;
  disabled?: boolean;
}): React.JSX.Element {
  const first = criteria[0]?.s_no ?? "";
  const [sNo, setSNo] = useState(first);
  const [pick, setPick] = useState<Verdict>("Pass");
  const [reason, setReason] = useState("");

  const trimmed = reason.trim();
  const reasonOk = trimmed.length >= 15;

  function submit() {
    if (!reasonOk) return;
    // Per caltrans cucp_reevals.py:207, "Request Additional Information" sets
    // request_info=Yes and the underlying eligibility verdict to Fail (which
    // the LLM then renders as "Not eligible at this time (pending additional
    // information)" in the final decision).
    const verdict: "Pass" | "Fail" = pick === "Request Additional Information" ? "Fail" : pick;
    const request_info: "Yes" | "No" = pick === "Request Additional Information" ? "Yes" : "No";
    onSave({ s_no: sNo, verdict, request_info, reason: trimmed });
    setReason("");
  }

  return (
    <div className="rounded-md border border-border bg-background p-4 space-y-4">
      <h4 className="text-sm font-semibold">Override a row</h4>

      <div className="space-y-1">
        <label
          htmlFor="l3-override-criterion"
          className="block text-sm font-medium"
        >
          Criterion to override:
        </label>
        <select
          id="l3-override-criterion"
          aria-label="Criterion to override"
          value={sNo}
          onChange={(e) => setSNo(e.target.value)}
          className={cn(SELECT_CLASS, "w-full")}
        >
          {criteria.map((c) => (
            <option key={c.s_no} value={c.s_no}>
              #{c.s_no} — {c.criterion}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="l3-override-verdict"
          className="block text-sm font-medium"
        >
          New verdict:
        </label>
        <select
          id="l3-override-verdict"
          aria-label="New verdict"
          value={pick}
          onChange={(e) => setPick(e.target.value as Verdict)}
          className={cn(SELECT_CLASS, "w-full")}
        >
          {VERDICTS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="l3-override-reason"
          className="block text-sm font-medium"
        >
          Reason (required, min 15 chars):
        </label>
        <textarea
          id="l3-override-reason"
          aria-label="Reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={TEXTAREA_CLASS}
        />
        <p className="text-xs text-muted-foreground">{trimmed.length} / 15 chars</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!reasonOk || disabled}
          onClick={submit}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Save Override
        </button>
      </div>
    </div>
  );
}
