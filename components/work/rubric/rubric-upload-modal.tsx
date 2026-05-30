"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/work/form-fields";

type Mode = "new-version" | "new-rubric";

export function RubricUploadModal({
  open,
  usecaseId,
  rubricId,
  onUploaded,
  onClose,
}: {
  open: boolean;
  usecaseId: string;
  rubricId: string;
  onUploaded: (result: { rubricId: string; versionId: string }) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("new-version");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [newRubricId, setNewRubricId] = useState("");
  const [newRubricLabel, setNewRubricLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (!file) return;
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("mode", mode);
      form.set("rubricId", mode === "new-rubric" ? newRubricId : rubricId);
      if (mode === "new-rubric") form.set("label", newRubricLabel);
      if (note) form.set("note", note);
      form.set("file", file);
      const res = await fetch(`/api/usecases/${usecaseId}/rubrics/upload`, {
        method: "POST",
        body: form,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? `Upload failed (${res.status})`);
        return;
      }
      onUploaded({ rubricId: body.rubricId, versionId: body.versionId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed — try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rubric-upload-title"
    >
      <div className="w-full max-w-md border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
        <h2 id="rubric-upload-title" className="mb-3 text-sm font-semibold text-foreground">
          Upload rubric
        </h2>

        <fieldset className="mb-3 space-y-1">
          <legend className="mb-1 text-xs font-medium text-foreground/85">Target</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mode"
              value="new-version"
              checked={mode === "new-version"}
              onChange={() => setMode("new-version")}
            />
            Add as a new version of <code className="bg-muted px-1 text-[12px]">{rubricId}</code>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mode"
              value="new-rubric"
              checked={mode === "new-rubric"}
              onChange={() => setMode("new-rubric")}
            />
            Create a new rubric
          </label>
        </fieldset>

        {mode === "new-rubric" && (
          <div className="mb-3 space-y-2">
            <label className="block text-xs font-medium text-foreground/85">
              New rubric id (kebab-case)
              <input
                type="text"
                value={newRubricId}
                onChange={(e) => setNewRubricId(e.target.value)}
                className="mt-1 block w-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-foreground/85">
              Label
              <input
                type="text"
                value={newRubricLabel}
                onChange={(e) => setNewRubricLabel(e.target.value)}
                className="mt-1 block w-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        )}

        <label className="mb-3 block text-xs font-medium text-foreground/85">
          File (JSON)
          <input
            aria-label="File"
            type="file"
            accept="application/json,.json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </label>

        <label className="mb-3 block text-xs font-medium text-foreground/85">
          Note (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            rows={2}
            className="mt-1 block w-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-sm"
            placeholder="What changed in this version?"
          />
        </label>

        {error && (
          <div role="alert" className="mb-3 border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton
            type="button"
            disabled={
              !file ||
              submitting ||
              (mode === "new-rubric" && (!newRubricId || !newRubricLabel))
            }
            onClick={handleSubmit}
          >
            {submitting ? "Uploading…" : "Upload"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
