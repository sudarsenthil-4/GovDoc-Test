"use client";
import type { FormEvent } from "react";
import { Play } from "lucide-react";
import { usePipelineStore } from "@/store/use-pipeline";
import {
  Field,
  FilePicker,
  PrimaryButton,
  RadioGroup,
} from "@/components/work/form-fields";

const ROLE_OPTIONS = [
  {
    value: "district",
    label: "Review project",
    description: "Read-only review of the AI-generated recommendation.",
  },
  {
    value: "hifl",
    label: "Human-in-the-Feedback Loop",
    description: "Step through flagged questions and record corrections before export.",
  },
];

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
    await usePipelineStore.getState().start("cmgc-pde", fd);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {rubricId && <input type="hidden" name="rubricId" value={rubricId} />}
      {rubricVersionId && <input type="hidden" name="rubricVersionId" value={rubricVersionId} />}
      <Field htmlFor="role-district" label="Reviewer role" required hint="Locked to this run. To use the other role, start a new evaluation.">
        <RadioGroup name="role" options={ROLE_OPTIONS} required legend="Reviewer role" />
      </Field>

      <Field
        htmlFor="factSheet"
        label="Project nomination fact sheet (DOCX or PDF)"
        required
        hint="Pass one or more nomination fact sheets. The first will be used as the primary narrative; its filename becomes the project name."
      >
        <FilePicker
          id="factSheet"
          name="factSheet"
          accept=".docx,.pdf"
          multiple
          required
        />
      </Field>

      <div className="flex justify-end pt-1">
        <PrimaryButton>
          <Play className="size-4" /> Run evaluation
        </PrimaryButton>
      </div>
    </form>
  );
}
