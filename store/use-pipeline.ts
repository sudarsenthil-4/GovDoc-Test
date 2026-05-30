import { create } from "zustand";
import type { StepEvent, HumanInput } from "@/lib/usecases/types";

type StageState = {
  id: string;
  label: string;
  status: "pending" | "running" | "needs-input" | "done" | "error";
  pct: number;
  message?: string;
  partial?: unknown;
  data?: unknown;
  error?: string;
};

export type ReviewerRole = "district" | "hifl";

type PipelineRun = {
  runId: string;
  useCaseId: string;
  projectId: string;
  status: "idle" | "running" | "needs-input" | "done" | "error";
  stages: Record<string, StageState>;
  pendingInput?: HumanInput;
  result?: unknown;
  role?: ReviewerRole;
};

type Store = {
  current: PipelineRun | null;
  start: (useCaseId: string, formData: FormData) => Promise<void>;
  applyEvent: (ev: StepEvent) => void;
  reset: () => void;
};

function ensureStage(run: PipelineRun, id: string): StageState {
  if (!run.stages[id]) {
    run.stages[id] = { id, label: id, status: "pending", pct: 0 };
  }
  return run.stages[id]!;
}

export const usePipelineStore = create<Store>((set, get) => ({
  current: null,
  reset: () => set({ current: null }),
  applyEvent: (ev) =>
    set((state) => {
      if (!state.current) return state;
      const run = { ...state.current, stages: { ...state.current.stages } };
      switch (ev.type) {
        case "run-started": {
          run.runId = ev.runId;
          if (ev.projectId) run.projectId = ev.projectId;
          break;
        }
        case "progress": {
          const stage = { ...ensureStage(run, ev.stage), status: "running" as const, pct: ev.pct, message: ev.message };
          run.stages[ev.stage] = stage;
          break;
        }
        case "partial": {
          const stage = { ...ensureStage(run, ev.stage), partial: ev.data };
          run.stages[ev.stage] = stage;
          break;
        }
        case "stage-done": {
          const stage = { ...ensureStage(run, ev.stage), status: "done" as const, pct: 100, data: ev.data };
          run.stages[ev.stage] = stage;
          break;
        }
        case "needs-input": {
          const stage = { ...ensureStage(run, ev.stage), status: "needs-input" as const };
          run.stages[ev.stage] = stage;
          run.pendingInput = ev.prompt;
          run.status = "needs-input";
          break;
        }
        case "done": {
          run.status = "done";
          run.result = ev.result;
          break;
        }
        case "error": {
          const stage = { ...ensureStage(run, ev.stage), status: "error" as const, error: ev.message };
          run.stages[ev.stage] = stage;
          run.status = "error";
          break;
        }
      }
      return { current: run };
    }),
  start: async (useCaseId, formData) => {
    const projectIdRaw = formData.get("projectId");
    const projectId = typeof projectIdRaw === "string" ? projectIdRaw.trim() : "_default";
    // Reviewer role is a UI gate (not consumed by the pipeline); strip from
    // FormData before POST so the server payload stays unchanged.
    const roleRaw = formData.get("role");
    const role: ReviewerRole | undefined =
      roleRaw === "district" || roleRaw === "hifl" ? roleRaw : undefined;
    formData.delete("role");
    set({
      current: { runId: "", useCaseId, projectId, status: "running", stages: {}, ...(role ? { role } : {}) },
    });
    const res = await fetch(`/api/usecases/${useCaseId}/run`, { method: "POST", body: formData });
    if (!res.ok || !res.body) {
      get().applyEvent({ type: "error", stage: "init", message: await res.text() });
      return;
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      const blocks = buf.split("\n\n");
      buf = blocks.pop() ?? "";
      for (const b of blocks) {
        if (!b.startsWith("data: ")) continue;
        get().applyEvent(JSON.parse(b.slice(6)) as StepEvent);
      }
    }
  },
}));
