"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ExtractedFact, L1FactField, L1Override } from "@/lib/usecases/cucp-reevals/types";

const FIELDS: readonly L1FactField[] = ["When", "Where", "Who", "What", "Why", "Magnitude"];
const NON_FACT_TARGETS = ["Firm Name", "Narrative Declared PNW", "Specific Incident Detail"] as const;

type Props = {
  facts: readonly ExtractedFact[];
  onSubmitOverride: (o: L1Override) => void;
  onUndo: () => void;
  onClear: () => void;
  stagedCount: number;
  persistentCount: number;
  disabled?: boolean;
};

const SELECT_CLASS =
  "h-9 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 text-sm text-[var(--color-ink)] transition-colors hover:bg-[var(--color-cream-soft)] focus:border-[var(--color-govdoc-primary)] focus:bg-[var(--color-paper)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)] disabled:opacity-50 disabled:cursor-not-allowed";

const TEXTAREA_CLASS =
  "mt-1 block w-full rounded-lg border border-input bg-muted/30 p-2 text-sm transition-colors focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none";

const INPUT_CLASS =
  "block w-full rounded-lg border border-input bg-muted/30 p-2 text-sm transition-colors focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15";

export function L1OverrideForm({
  facts,
  onSubmitOverride,
  onUndo,
  onClear,
  stagedCount,
  persistentCount,
  disabled = false,
}: Props) {
  const targetOptions = [
    ...facts.map((f) => `Fact ${f.id}`),
    ...NON_FACT_TARGETS,
  ];

  const [target, setTarget] = useState<string>(targetOptions[0] ?? "Firm Name");
  const [field, setField] = useState<L1FactField>("When");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  const isFact = target.startsWith("Fact ");
  const trimmedReason = reason.trim();
  const trimmedValue = value.trim();
  const reasonOk = trimmedReason.length >= 15 && trimmedReason.length <= 1000;
  const valueOk = trimmedValue.length > 0 && trimmedValue.length <= 500;
  const total = stagedCount + persistentCount;
  const limitReached = total >= 45;
  const submitDisabled = disabled || !reasonOk || !valueOk || limitReached;

  function valueLabel(): string {
    if (target === "Firm Name") return "Correct Firm Name";
    if (target === "Narrative Declared PNW") return "Correct PNW Amount";
    if (target === "Specific Incident Detail") return "Describe the missing or incorrect incident";
    return "Corrected Value";
  }

  function buildOverride(): L1Override | null {
    if (target === "Firm Name") {
      return { kind: "firm-name", corrected_value: trimmedValue, reason: trimmedReason };
    }
    if (target === "Narrative Declared PNW") {
      return { kind: "narrative-pnw", corrected_value: trimmedValue, reason: trimmedReason };
    }
    if (target === "Specific Incident Detail") {
      return { kind: "specific-incident", description: trimmedValue, reason: trimmedReason };
    }
    if (isFact) {
      const fact_id = target.slice("Fact ".length);
      return { kind: "fact-field", fact_id, field, corrected_value: trimmedValue, reason: trimmedReason };
    }
    return null;
  }

  function submit() {
    if (submitDisabled) return;
    const o = buildOverride();
    if (!o) return;
    onSubmitOverride(o);
    setValue("");
    setReason("");
  }

  return (
    <details className="rounded-md border border-border bg-background">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">
        ✏️ Structural issue? Click here to correct via AI re-run
      </summary>
      <div className="space-y-4 px-4 pb-4">
        {stagedCount > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onUndo}
              disabled={disabled}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              ↩ Undo Last Correction
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              🗑 Clear All Corrections
            </button>
          </div>
        )}

        {limitReached ? (
          <p className="rounded-md border border-l-4 border-destructive/30 border-l-destructive bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
            Correction limit reached ({total}/45). Your corrections will be auto-merged.
          </p>
        ) : total >= 36 ? (
          <p className="rounded-md border border-l-4 border-border border-l-muted-foreground bg-card px-3 py-2 text-xs font-medium text-foreground">
            Approaching correction limit ({total}/45). Corrections will be auto-merged when the limit is reached.
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="block font-medium">What to Correct</span>
            <select
              aria-label="What to Correct"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={cn(SELECT_CLASS, "w-full")}
            >
              {targetOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="block font-medium">Which Field</span>
            <select
              aria-label="Which Field"
              value={field}
              onChange={(e) => setField(e.target.value as L1FactField)}
              disabled={!isFact}
              className={cn(SELECT_CLASS, "w-full")}
            >
              {FIELDS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="block font-medium">{valueLabel()}</span>
          <input
            aria-label={valueLabel()}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="block font-medium">
            Reasoning for Change (What should the AI remember?)
          </span>
          <textarea
            aria-label="Reasoning"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={TEXTAREA_CLASS}
          />
          <p className="text-xs text-muted-foreground">{trimmedReason.length} / 15 chars</p>
        </label>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={submitDisabled}
            onClick={submit}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            Apply Correction & Re-Evaluate
          </button>
        </div>

        <p className="text-xs italic text-muted-foreground">
          Your corrections are saved only after you approve the final evaluation at the end.
        </p>
      </div>
    </details>
  );
}
