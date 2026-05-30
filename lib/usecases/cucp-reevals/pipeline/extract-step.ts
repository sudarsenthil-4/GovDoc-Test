import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import { extractTextFromPdf } from "@/lib/extract/pdf";
import { parseFirmRevenuesFromXlsx } from "@/lib/usecases/cucp-reevals/extract/revenue-xlsx";

export const extractStep: PipelineStep<FormData> = {
  id: "extract",
  label: "Extract narrative + optional revenues",
  async *run(formData, _ctx) {
    yield { type: "progress", stage: "extract", pct: 0, message: "Reading uploaded documents" } satisfies StepEvent;
    const narrative = formData.get("narrative");
    if (!(narrative && typeof narrative === "object" && "arrayBuffer" in narrative)) {
      yield { type: "error", stage: "extract", message: "No narrative file uploaded" } satisfies StepEvent;
      return;
    }
    const narrativeBuffer = Buffer.from(await (narrative as File).arrayBuffer());
    const narrativeText = await extractTextFromPdf(narrativeBuffer);

    yield { type: "progress", stage: "extract", pct: 50, message: "Parsing narrative" } satisfies StepEvent;

    let firmRevenues = {};
    const revenues = formData.get("revenues");
    if (revenues && typeof revenues === "object" && "arrayBuffer" in revenues && (revenues as File).size > 0) {
      const buf = Buffer.from(await (revenues as File).arrayBuffer());
      firmRevenues = await parseFirmRevenuesFromXlsx(buf);
    }
    yield { type: "stage-done", stage: "extract", data: { narrativeText, firmRevenues } } satisfies StepEvent;
  },
};
