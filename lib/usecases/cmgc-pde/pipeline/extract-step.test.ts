import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { extractStep } from "./extract-step";
import type { StepEvent, StepContext } from "@/lib/usecases/types";

const DOCX = path.resolve(__dirname, "../../../../tests/fixtures/cmgc/synthetic-narrative.docx");

function makeCtx(): StepContext {
  return {
    userId: "test", projectId: "_test", runId: "r1", prior: {},
    staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
    llm: { call: async () => ({ text: "" }) },
    abortSignal: new AbortController().signal,
    log: () => {},
  };
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of iter) out.push(x);
  return out;
}

describe("extractStep", () => {
  it("emits progress 0 → 50 → stage-done with narrative + projectName", async () => {
    const buf = readFileSync(DOCX);
    const file = new File([buf], "synthetic-narrative.docx");
    const fd = new FormData();
    fd.append("factSheet", file);
    fd.append("projectName", "Test Project");

    const events = await collect(extractStep.run(fd, makeCtx())) as StepEvent[];
    expect(events[0]).toMatchObject({ type: "progress", stage: "extract", pct: 0 });
    expect(events[1]).toMatchObject({ type: "progress", stage: "extract", pct: 50 });
    const last = events.at(-1)!;
    expect(last.type).toBe("stage-done");
    expect((last as Extract<StepEvent, { type: "stage-done" }>).data).toMatchObject({
      projectName: "Test Project",
    });
    const data = (last as Extract<StepEvent, { type: "stage-done" }>).data as { narrative: string; files: { name: string; size: number }[] };
    expect(data.narrative).toContain("$48.7 million");
    expect(data.files).toHaveLength(1);
    expect(data.files[0]!.name).toBe("synthetic-narrative.docx");
  });

  it("emits error when no factSheet files uploaded", async () => {
    const fd = new FormData();
    const events = await collect(extractStep.run(fd, makeCtx())) as StepEvent[];
    expect(events.at(-1)).toMatchObject({ type: "error", stage: "extract" });
  });

  it("supports multiple factSheet files", async () => {
    const buf = readFileSync(DOCX);
    const fd = new FormData();
    fd.append("factSheet", new File([buf], "a.docx"));
    fd.append("factSheet", new File([buf], "b.docx"));
    const events = await collect(extractStep.run(fd, makeCtx())) as StepEvent[];
    const stageDone = events.find((e) => e.type === "stage-done")!;
    const data = (stageDone as Extract<StepEvent, { type: "stage-done" }>).data as { files: { name: string }[] };
    expect(data.files).toHaveLength(2);
  });
});
