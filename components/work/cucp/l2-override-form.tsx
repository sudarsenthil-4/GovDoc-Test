"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { L2_LEGAL_CATEGORIES, type L2OverridePayload, type L2Row } from "./l2-classifications-table";

const SELECT_CLASS =
  "h-9 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 text-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-cream-soft)] focus:border-[var(--color-govdoc-primary)] focus:bg-[var(--color-paper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]";

const TEXTAREA_CLASS =
  "mt-1 block w-full rounded-lg border border-input bg-muted/30 p-2 text-sm transition-colors focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none";

export function L2OverrideForm({
  rows,
  onSaveOverride,
  disabled = false,
}: {
  rows: readonly L2Row[];
  onSaveOverride: (p: L2OverridePayload) => void;
  disabled?: boolean;
}): React.JSX.Element {
  const first = rows[0]?.fact_id ?? "";
  const [factId, setFactId] = useState(first);
  const [cat, setCat] = useState<string>(L2_LEGAL_CATEGORIES[0]);
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  const reasonOk = trimmed.length >= 15;

  function submit() {
    if (!reasonOk) return;
    onSaveOverride({ fact_id: factId, new_category: cat, reason: trimmed });
    setReason("");
  }

  return (
    <div className="rounded-md border border-border bg-background p-4 space-y-4">
      <h4 className="text-sm font-semibold">Override a classification</h4>

      <div className="space-y-1">
        <label htmlFor="l2-override-fact" className="block text-sm font-medium">
          Fact #:
        </label>
        <select
          id="l2-override-fact"
          aria-label="Fact #"
          value={factId}
          onChange={(e) => setFactId(e.target.value)}
          className={cn(SELECT_CLASS, "w-full")}
        >
          {rows.map((r) => (
            <option key={r.fact_id} value={r.fact_id}>
              {r.fact_id}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="l2-override-category" className="block text-sm font-medium">
          New category:
        </label>
        <select
          id="l2-override-category"
          aria-label="New category"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className={cn(SELECT_CLASS, "w-full")}
        >
          {L2_LEGAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="l2-override-reason" className="block text-sm font-medium">
          Legal Rationale (Why is this the correct classification?):
        </label>
        <textarea
          id="l2-override-reason"
          aria-label="Legal Rationale"
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
