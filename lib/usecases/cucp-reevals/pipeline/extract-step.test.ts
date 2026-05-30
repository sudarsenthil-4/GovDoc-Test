import { describe, it, expect, vi } from "vitest";
import { extractStep } from "./extract-step";
import type { StepContext } from "@/lib/usecases/types";

vi.mock("@/lib/extract/pdf", () => ({
  extractTextFromPdf: vi.fn(async () => "narrative body text"),
}));
vi.mock("@/lib/usecases/cucp-reevals/extract/revenue-xlsx", () => ({
  parseFirmRevenuesFromXlsx: vi.fn(async () => ({ "Acme LLC": { revenue: 1500000 } })),
}));

const fakeCtx = {
  userId: "u", projectId: "_test", runId: "r", prior: {},
  staged: { level_1_precedents: [], level_2_precedents: [], level_3_precedents: [] },
  llm: { call: vi.fn() } as unknown as StepContext["llm"],
  abortSignal: new AbortController().signal, log: vi.fn(),
} satisfies StepContext;

async function collect(iter: AsyncIterable<unknown>) {
  const out: unknown[] = [];
  for await (const ev of iter) out.push(ev);
  return out;
}

describe("extractStep", () => {
  it("emits error when narrative is missing", async () => {
    const fd = new FormData();
    const events = await collect(extractStep.run(fd, fakeCtx));
    expect(events).toContainEqual(expect.objectContaining({ type: "error", stage: "extract" }));
  });

  it("processes narrative-only and emits stage-done with empty firmRevenues", async () => {
    const fd = new FormData();
    fd.append("narrative", new File([new Uint8Array([1,2,3])], "n.pdf", { type: "application/pdf" }));
    const events = await collect(extractStep.run(fd, fakeCtx));
    const done = events.find((e: any) => e.type === "stage-done") as any;
    expect(done.data).toEqual({ narrativeText: "narrative body text", firmRevenues: {} });
  });

  it("processes narrative + revenues and emits firmRevenues from XLSX parser", async () => {
    const fd = new FormData();
    fd.append("narrative", new File([new Uint8Array([1])], "n.pdf"));
    fd.append("revenues", new File([new Uint8Array([2])], "r.xlsx"));
    const events = await collect(extractStep.run(fd, fakeCtx));
    const done = events.find((e: any) => e.type === "stage-done") as any;
    expect(done.data.firmRevenues).toEqual({ "Acme LLC": { revenue: 1500000 } });
  });
});
