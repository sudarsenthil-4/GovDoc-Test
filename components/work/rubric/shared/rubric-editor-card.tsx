"use client";
import { useState } from "react";

export type EditorField = {
  name: string;
  label: string;
  type: "text" | "textarea";
  required?: boolean;
  placeholder?: string;
};

export type EditorSelect = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
};

export type EditorValues = Record<string, string>;

export function RubricEditorCard({
  mode,
  title,
  selects,
  onSelectChange,
  fields,
  initialValues,
  saveLabel,
  onSave,
  onCancel,
}: {
  mode: "edit" | "create";
  title: string;
  selects?: EditorSelect[];
  onSelectChange?: (name: string, value: string) => void;
  fields: EditorField[];
  initialValues: EditorValues;
  saveLabel?: string;
  onSave: (values: EditorValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<EditorValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSave() {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !values[f.name]?.trim()) {
        next[f.name] = `${f.label} is required`;
      }
    }
    setErrors(next);
    if (Object.keys(next).length === 0) onSave(values);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-[5vh]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="my-auto flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {mode === "edit" ? "Edit" : "Create"}
            </span>
            {title}
          </h3>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {selects && selects.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {selects.map((s) => (
                <label key={s.name} className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </span>
                  <select
                    aria-label={s.label}
                    value={s.value}
                    onChange={(e) => onSelectChange?.(s.name, e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    {s.options.map((o) => (
                      <option key={o.value} value={o.value} disabled={o.disabled}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {fields.map((f) => (
              <label key={f.name} className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {f.label}
                  {f.required && <span className="ml-1 text-destructive">*</span>}
                </span>
                {f.type === "textarea" ? (
                  <textarea
                    aria-label={f.label}
                    value={values[f.name] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                    }
                    rows={4}
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                ) : (
                  <input
                    aria-label={f.label}
                    type="text"
                    value={values[f.name] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [f.name]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  />
                )}
                {errors[f.name] && (
                  <span className="mt-1 block text-[11px] text-destructive">{errors[f.name]}</span>
                )}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)]"
          >
            {saveLabel ?? (mode === "edit" ? "Save changes" : "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}
