"use client";
import { type FormEvent } from "react";
import { Play } from "lucide-react";
import { usePipelineStore } from "@/store/use-pipeline";
import {
  Field,
  FilePicker,
  PrimaryButton,
} from "@/components/work/form-fields";

export function InputsForm({
  rubricId,
  rubricVersionId,
}: {
  rubricId?: string;
  rubricVersionId?: string;
}) {
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await usePipelineStore.getState().start("row-appraisal", fd);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {rubricId && <input type="hidden" name="rubricId" value={rubricId} />}
      {rubricVersionId && <input type="hidden" name="rubricVersionId" value={rubricVersionId} />}
      <Field
        htmlFor="pdf"
        label="Appraisal PDF"
        required
        hint={
          <p>
            Phase 1 includes bundled OCR for four sample appraisals. Other PDFs
            fall back to a default text layer.
          </p>
        }
      >
        <FilePicker id="pdf" name="pdf" accept=".pdf" required />
      </Field>

      <div className="flex justify-end pt-1">
        <PrimaryButton>
          <Play className="size-4" /> Run evaluation
        </PrimaryButton>
      </div>
    </form>
  );
}
