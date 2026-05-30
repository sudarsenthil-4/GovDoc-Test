"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { Rating } from "@/lib/usecases/cmgc-pde/rubric";

export type OverrideCardQuestion = {
  question_id: string;
  question_text: string;
  ai_rating: Rating;
  confidence: number | null;
  source_reasoning: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
  existing?: { newRating: Rating; reason: string };
};

export function OverrideCard({
  question,
  onSave,
}: {
  question: OverrideCardQuestion;
  onSave: (entry: { question_id: string; oldValue: Rating; newValue: Rating; reason: string }) => void;
}): React.JSX.Element {
  // Parents (HiflWizard) MUST pass `key={question.question_id}` so the component remounts
  // when the question changes — otherwise internal form state would leak between questions.
  const [newRating, setNewRating] = useState<Rating>(
    question.existing?.newRating ?? question.ai_rating,
  );
  const [reason, setReason] = useState(question.existing?.reason ?? "");
  const [showEvidence, setShowEvidence] = useState(false);

  const trimmedReason = reason.trim();
  const saveDisabled = trimmedReason.length === 0;

  const confidenceLabel =
    question.confidence != null
      ? ` (Confidence: ${Math.round(question.confidence * 100)}%)`
      : "";

  function handleSave() {
    if (saveDisabled) return;
    onSave({
      question_id: question.question_id,
      oldValue: question.ai_rating,
      newValue: newRating,
      reason: trimmedReason,
    });
  }

  return (
    <div className="rounded-md border border-border bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono font-semibold">{question.question_id}</span>
          <span className="mx-2 text-muted-foreground">—</span>
          <span>{question.question_text}</span>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">
          AI Rating:{" "}
          <span className="font-semibold text-foreground">{question.ai_rating}</span>
          {question.existing && question.existing.newRating !== question.ai_rating && (
            <>
              {" → "}
              <span className="font-semibold text-foreground">{question.existing.newRating}</span>
              <span className="ml-1 text-[11px] italic text-muted-foreground">
                (edited)
              </span>
            </>
          )}
        </span>
      </div>

      {/* Evidence toggle */}
      <div>
        <button
          type="button"
          aria-label="View AI Evidence"
          className="flex items-center gap-1 text-sm text-primary hover:underline focus:outline-none"
          onClick={() => setShowEvidence((v) => !v)}
        >
          <span>{showEvidence ? "▼" : "▶"}</span>
          <span>View AI Evidence{confidenceLabel}</span>
        </button>
        {showEvidence && (
          <blockquote className="mt-2 border-l-4 border-border pl-3 text-sm text-muted-foreground italic">
            {question.source_reasoning || "(no source)"}
          </blockquote>
        )}
      </div>

      {/* Rating override select */}
      <div className="space-y-1">
        <label
          htmlFor={`override-rating-${question.question_id}`}
          className="block text-sm font-medium"
        >
          Your Rating Override:
        </label>
        <select
          id={`override-rating-${question.question_id}`}
          value={newRating}
          onChange={(e) => setNewRating(e.target.value as Rating)}
          className={cn(
            "h-9 max-w-xs rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 text-sm text-[var(--color-ink)]",
            "transition-colors hover:bg-[var(--color-cream-soft)]",
            "focus:border-[var(--color-govdoc-primary)] focus:bg-[var(--color-paper)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]",
          )}
        >
          <option value="A">A — {question.options.A}</option>
          <option value="B">B — {question.options.B}</option>
          <option value="C">C — {question.options.C}</option>
        </select>
      </div>

      {/* Reason textarea */}
      <div className="space-y-1">
        <label
          htmlFor={`override-reason-${question.question_id}`}
          className="block text-sm font-medium"
        >
          Why are you changing this? (required to save)
        </label>
        <textarea
          id={`override-reason-${question.question_id}`}
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. 'Section 4 confirms 70% design complete, not 30% as assumed.'"
          className={cn(
            "w-full rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm",
            "transition-colors focus:border-primary/40 focus:bg-background",
            "focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none",
          )}
        />
        <p className="text-xs text-muted-foreground">
          {trimmedReason.length} chars
        </p>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saveDisabled}
          onClick={handleSave}
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
