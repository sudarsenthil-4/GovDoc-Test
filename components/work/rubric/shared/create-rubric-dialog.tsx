"use client";
import { useState } from "react";
import type { RubricsManifestEntry } from "@/lib/usecases/rubrics-store";

export type CreateRubricInput = {
  id: string;
  label: string;
  cloneFrom?: string;
};

type Props = {
  rubrics: readonly RubricsManifestEntry[];
  onSave: (input: CreateRubricInput) => Promise<void>;
  onCancel: () => void;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function CreateRubricDialog({ rubrics, onSave, onCancel }: Props) {
  const [label, setLabel] = useState("");
  const [id, setId] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [cloneFrom, setCloneFrom] = useState<string>(
    rubrics.find((r) => r.isDefault)?.id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveId = idTouched ? id : slugify(label);
  const idIsValid = /^[a-z0-9][a-z0-9_-]{0,63}$/.test(effectiveId);
  const labelIsValid = label.trim().length > 0;
  const idIsTaken = rubrics.some((r) => r.id === effectiveId);
  const canSave = labelIsValid && idIsValid && !idIsTaken && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id: effectiveId,
        label: label.trim(),
        cloneFrom: cloneFrom || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-[5vh]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create new rubric"
        onClick={(e) => e.stopPropagation()}
        className="my-auto flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-border bg-card shadow-xl"
      >
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Create
            </span>
            New rubric
          </h3>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Label <span className="text-destructive">*</span>
            </span>
            <input
              autoFocus
              aria-label="Label"
              type="text"
              value={label}
              placeholder="e.g. DBE Pilot Q2"
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              ID <span className="text-destructive">*</span>
            </span>
            <input
              aria-label="ID"
              type="text"
              value={effectiveId}
              placeholder="auto-generated from label"
              onChange={(e) => {
                setIdTouched(true);
                setId(e.target.value);
              }}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs"
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              URL-safe slug. Lowercase letters, digits, hyphens, underscores.
            </span>
            {idIsTaken && (
              <span className="mt-1 block text-[11px] text-destructive">
                A rubric with this ID already exists.
              </span>
            )}
            {effectiveId.length > 0 && !idIsValid && (
              <span className="mt-1 block text-[11px] text-destructive">
                ID must start with a letter or digit and use only a–z, 0–9, hyphen, underscore.
              </span>
            )}
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Clone from
            </span>
            <select
              aria-label="Clone from"
              value={cloneFrom}
              onChange={(e) => setCloneFrom(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">— Start from defaults —</option>
              {rubrics.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                  {r.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <div className="rounded-md border border-l-4 border-destructive/30 border-l-destructive bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)] disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create rubric"}
          </button>
        </div>
      </div>
    </div>
  );
}
