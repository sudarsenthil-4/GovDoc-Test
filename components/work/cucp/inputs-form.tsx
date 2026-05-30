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
    await usePipelineStore.getState().start("cucp-reevals", fd);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {rubricId && <input type="hidden" name="rubricId" value={rubricId} />}
      {rubricVersionId && <input type="hidden" name="rubricVersionId" value={rubricVersionId} />}
      <Field
        htmlFor="narrative"
        label="Personal Narrative Statement (PDF)"
        required
      >
        <FilePicker id="narrative" name="narrative" accept=".pdf" required />
      </Field>

      <Field
        htmlFor="revenues"
        label="Firm revenues spreadsheet (XLSX, optional)"
        hint="Upload to enable the small business size threshold check."
      >
        <FilePicker id="revenues" name="revenues" accept=".xlsx" />
      </Field>

      <div className="flex justify-end pt-1">
        <PrimaryButton>
          <Play className="size-4" /> Run re-evaluation
        </PrimaryButton>
      </div>
    </form>
  );
}
