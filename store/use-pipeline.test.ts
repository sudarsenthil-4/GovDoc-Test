import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { usePipelineStore } from "./use-pipeline";
import type { StepEvent } from "@/lib/usecases/types";

beforeEach(() => usePipelineStore.getState().reset());
afterEach(() => vi.unstubAllGlobals());

describe("usePipelineStore", () => {
  it("starts idle", () => {
    expect(usePipelineStore.getState().current).toBeNull();
  });

  it("applies progress event", () => {
    usePipelineStore.setState({ current: { runId: "r1", useCaseId: "x", projectId: "_default", status: "running", stages: {} } });
    usePipelineStore.getState().applyEvent({ type: "progress", stage: "s1", pct: 10, message: "go" } as StepEvent);
    const s1 = usePipelineStore.getState().current!.stages["s1"]!;
    expect(s1.pct).toBe(10);
    expect(s1.status).toBe("running");
  });

  it("applies stage-done event", () => {
    usePipelineStore.setState({ current: { runId: "r1", useCaseId: "x", projectId: "_default", status: "running", stages: {} } });
    usePipelineStore.getState().applyEvent({ type: "stage-done", stage: "s1", data: { ok: 1 } } as StepEvent);
    expect(usePipelineStore.getState().current!.stages["s1"]!.status).toBe("done");
  });

  it("applies done event", () => {
    usePipelineStore.setState({ current: { runId: "r1", useCaseId: "x", projectId: "_default", status: "running", stages: {} } });
    usePipelineStore.getState().applyEvent({ type: "done", result: { final: true } } as StepEvent);
    expect(usePipelineStore.getState().current!.status).toBe("done");
    expect(usePipelineStore.getState().current!.result).toEqual({ final: true });
  });

  it("applies error event", () => {
    usePipelineStore.setState({ current: { runId: "r1", useCaseId: "x", projectId: "_default", status: "running", stages: {} } });
    usePipelineStore.getState().applyEvent({ type: "error", stage: "s1", message: "boom" } as StepEvent);
    expect(usePipelineStore.getState().current!.status).toBe("error");
  });

  it("strips role from FormData before POST and stores it on the run", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const fd = new FormData();
    fd.set("role", "hifl");
    fd.set("projectId", "P1");
    await usePipelineStore.getState().start("cmgc-pde", fd);
    const call = fetchMock.mock.calls[0] as unknown as [string, { body: FormData }];
    expect(call[1].body.get("role")).toBeNull();
    expect(call[1].body.get("projectId")).toBe("P1");
    expect(usePipelineStore.getState().current?.role).toBe("hifl");
  });

  it("does not set role on the run when no role field is in FormData", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));
    await usePipelineStore.getState().start("cmgc-pde", new FormData());
    expect(usePipelineStore.getState().current?.role).toBeUndefined();
  });
});
