import type { LlmRouter } from "@/lib/llm/types";
import type { StagedState } from "@/lib/usecases/cucp-reevals/memory/precedents";

export type InputSpec =
  | { kind: "file"; id: string; label: string; accept: string[]; multiple?: boolean; required?: boolean }
  | { kind: "select"; id: string; label: string; options: { value: string; label: string }[]; default?: string }
  | { kind: "text"; id: string; label: string; placeholder?: string; required?: boolean }
  | { kind: "json-upload"; id: string; label: string; help?: string }
  | { kind: "model-pick"; id: string; label: string; providers: ("openai" | "anthropic" | "groq")[] };

export type HumanInput = {
  kind: "approve-or-override";
  category: string;
  proposed: { decision: string; rationale: string };
};

export type StepEvent =
  | { type: "run-started"; runId: string; projectId?: string }
  | { type: "progress"; stage: string; pct: number; message?: string }
  | { type: "partial"; stage: string; data: unknown }
  | { type: "stage-done"; stage: string; data: unknown }
  | { type: "needs-input"; stage: string; level?: 1 | 2 | 3; prompt: HumanInput }
  | { type: "done"; result: unknown }
  | { type: "error"; stage: string; message: string };

export type StepContext = {
  userId: string;
  projectId: string;
  runId: string;
  prior: Record<string, unknown>;
  staged: StagedState;
  llm: LlmRouter;
  abortSignal: AbortSignal;
  log: (msg: string, data?: unknown) => void;
  rubricId?: string;
  rubricVersionId?: string;
  rubric?: unknown;
};

export type PipelineStep<TIn = unknown> = {
  id: string;
  label: string;
  run: (input: TIn, ctx: StepContext) => AsyncIterable<StepEvent>;
};

export type Exporter = {
  id: string;
  label: string;
  contentType: string;
  build: (result: unknown) => Promise<Uint8Array>;
};

export type ResultView =
  | { kind: "wizard" }
  | { kind: "pass-fail-criteria" }
  | { kind: "score-table" };

export type UseCaseId = "cmgc-pde" | "cucp-reevals" | "row-appraisal";

export type UseCase = {
  id: UseCaseId;
  label: string;
  blurb: string;
  tile: "review";
  inputs: InputSpec[];
  pipeline: PipelineStep<any>[];
  exporters: Exporter[];
  resultView: ResultView;
};
