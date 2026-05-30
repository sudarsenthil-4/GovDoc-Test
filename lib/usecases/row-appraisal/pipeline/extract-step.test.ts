import { describe, it, expect, vi } from "vitest";
import { extractStep } from "./extract-step";
import type { StepContext } from "@/lib/usecases/types";

const fakeCtx: StepContext = {
  userId: "u",
  projectId: "_test",
  runId: "r",
  prior: {},
  staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
  llm: { call: vi.fn() },
  abortSignal: new AbortController().signal,
  log: vi.fn(),
};

async function collect(iter: AsyncIterable<unknown>) {
  const out: unknown[] = [];
  for await (const ev of iter) out.push(ev);
  return out;
}

describe("row-appraisal extractStep", () => {
  it("emits progress then stage-done with correct markdown_asset and non-empty extracted_text", async () => {
    const file = new File(
      [new Uint8Array([1])],
      "Appraisal_EA2F590_Parcel_36668.pdf",
      { type: "application/pdf" },
    );
    const fd = new FormData();
    fd.append("pdf", file);

    const events = await collect(extractStep.run(fd, fakeCtx));

    const progressEvents = events.filter((e: any) => e.type === "progress" && e.stage === "extract");
    expect(progressEvents.length).toBeGreaterThanOrEqual(1);

    const done = events.find((e: any) => e.type === "stage-done") as any;
    expect(done).toBeDefined();
    expect(done.stage).toBe("extract");
    expect(done.data.markdown_asset).toBe("landing_ai_output.md");
    expect(typeof done.data.extracted_text).toBe("string");
    expect(done.data.extracted_text.length).toBeGreaterThan(0);
    expect(done.data.pdf_filename).toBe("Appraisal_EA2F590_Parcel_36668.pdf");

    // Progress must come before stage-done
    const progressIdx = events.findIndex((e: any) => e.type === "progress" && e.stage === "extract");
    const doneIdx = events.findIndex((e: any) => e.type === "stage-done");
    expect(progressIdx).toBeLessThan(doneIdx);
  });

  it("emits error event when loadBundledMarkdownForFilename returns null", async () => {
    const mod = await import("@/lib/usecases/row-appraisal/extract/load-bundled-md");
    const spy = vi
      .spyOn(mod, "loadBundledMarkdownForFilename")
      .mockResolvedValueOnce(null);

    const file = new File([new Uint8Array([1])], "definitely-not-mapped.pdf", {
      type: "application/pdf",
    });
    const fd = new FormData();
    fd.append("pdf", file);

    const events = await collect(extractStep.run(fd, fakeCtx));

    const errorEvent = events.find((e: any) => e.type === "error") as any;
    expect(errorEvent).toBeDefined();
    expect(errorEvent.stage).toBe("extract");
    expect(errorEvent.message).toContain("No bundled Landing AI output");

    spy.mockRestore();
  });

  it("emits hardcoded openai provider and gpt-4.1 model in stage-done", async () => {
    const file = new File(
      [new Uint8Array([1])],
      "Appraisal_EA2F590_Parcel_36668.pdf",
      { type: "application/pdf" },
    );
    const fd = new FormData();
    fd.append("pdf", file);

    const events = await collect(extractStep.run(fd, fakeCtx));
    const done = events.find((e: any) => e.type === "stage-done") as any;
    expect(done.data.provider).toBe("openai");
    expect(done.data.model).toBe("gpt-4.1");
  });

  it("emits pdf_bytes_b64 (non-empty base64) in stage-done", async () => {
    const file = new File(
      [new Uint8Array([0x25, 0x50, 0x44, 0x46])], // %PDF magic
      "Appraisal_EA2F590_Parcel_36668.pdf",
      { type: "application/pdf" },
    );
    const fd = new FormData();
    fd.append("pdf", file);

    const events = await collect(extractStep.run(fd, fakeCtx));
    const done = events.find((e: any) => e.type === "stage-done") as any;
    expect(typeof done.data.pdf_bytes_b64).toBe("string");
    expect(done.data.pdf_bytes_b64.length).toBeGreaterThan(0);
    // 4-byte input encodes to a known base64 prefix
    expect(done.data.pdf_bytes_b64).toBe("JVBERg==");
  });
});
