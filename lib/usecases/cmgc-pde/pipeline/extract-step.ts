import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import { extractMultiDocContext } from "../extract/narrative";

export const extractStep: PipelineStep<FormData> = {
  id: "extract",
  label: "Extract narrative",
  async *run(formData, _ctx) {
    yield { type: "progress", stage: "extract", pct: 0, message: "Reading uploaded documents" } satisfies StepEvent;
    const entries = formData.getAll("factSheet").filter((v): v is File =>
      typeof v === "object" && v !== null && "arrayBuffer" in v,
    );
    if (entries.length === 0) {
      yield { type: "error", stage: "extract", message: "No fact-sheet files uploaded" } satisfies StepEvent;
      return;
    }
    const buffers = await Promise.all(entries.map(async (f) => ({
      name: f.name,
      buffer: Buffer.from(await f.arrayBuffer()),
    })));
    yield { type: "progress", stage: "extract", pct: 50, message: "Parsing text" } satisfies StepEvent;
    const narrative = await extractMultiDocContext(buffers);
    const submitted = (formData.get("projectName") as string | null) ?? "";
    const firstName = entries[0]?.name ?? "";
    const projectName = submitted.trim() || firstName.replace(/\.[^./\\]+$/, "");
    yield { type: "stage-done", stage: "extract", data: {
      narrative,
      projectName,
      files: buffers.map((b) => ({ name: b.name, size: b.buffer.byteLength })),
    } } satisfies StepEvent;
  },
};
