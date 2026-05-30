import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { getUseCase } from "@/lib/usecases/registry";
import { sseStream } from "@/lib/sse/stream";
import { makeLlmRouter } from "@/lib/llm/router";
import type { StepContext, StepEvent } from "@/lib/usecases/types";
import { logger } from "@/lib/logger";
import { EMPTY_PRECEDENTS } from "@/lib/usecases/cucp-reevals/memory/precedents";
import { getDefaultRubricId, loadRubric } from "@/lib/usecases/rubrics-store";

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

// Strip the extension and replace path-unsafe characters so the result passes
// the cucp memory store's projectId validator (no /, \, .., \0, no empty string).
function projectIdFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^./\\]+$/, "");
  const cleaned = stem
    .replace(/[\\/]/g, "_")
    .replace(/\.{2,}/g, "_")
    .replace(/\0/g, "")
    .trim();
  return cleaned || "";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const useCase = getUseCase(id);
  if (!useCase) return new NextResponse("Unknown use case", { status: 404 });

  const formData = await req.formData();
  const rubricIdField = formData.get("rubricId");
  const rubricVersionField = formData.get("rubricVersionId");
  const submittedRubricId =
    typeof rubricIdField === "string" && rubricIdField.length > 0 ? rubricIdField : undefined;
  const submittedRubricVersion =
    typeof rubricVersionField === "string" && rubricVersionField.length > 0
      ? rubricVersionField
      : undefined;
  const resolvedRubricId = submittedRubricId ?? (await getDefaultRubricId(id));
  const rubricContent = await loadRubric(id, resolvedRubricId, submittedRubricVersion);
  const projectIdRaw = formData.get("projectId");
  const submittedProjectId = typeof projectIdRaw === "string" ? projectIdRaw.trim() : "";
  let derivedProjectId = "";
  if (id === "cucp-reevals" && !submittedProjectId) {
    const narrative = formData.get("narrative");
    if (narrative instanceof File && narrative.name) {
      derivedProjectId = projectIdFromFilename(narrative.name);
    }
    if (!derivedProjectId) {
      return new NextResponse("Narrative file is required", { status: 400 });
    }
  } else if (id === "cmgc-pde" && !submittedProjectId) {
    const factSheets = formData.getAll("factSheet").filter((v): v is File => v instanceof File);
    const first = factSheets[0];
    if (first?.name) derivedProjectId = projectIdFromFilename(first.name);
  }
  const effectiveProjectId = submittedProjectId || derivedProjectId || "_default";
  const runId = crypto.randomUUID();

  return sseStream(async function* () {
    const ctx: StepContext = {
      userId: session.user,
      projectId: effectiveProjectId,
      runId,
      prior: {},
      staged: {
        level_1_precedents: [...EMPTY_PRECEDENTS.level_1_precedents],
        level_2_precedents: [...EMPTY_PRECEDENTS.level_2_precedents],
        level_3_precedents: [...EMPTY_PRECEDENTS.level_3_precedents],
        l1_field_overrides: {},
        l1_action_log: [],
      },
      llm: makeLlmRouter(),
      abortSignal: req.signal,
      log: (msg, data) => logger.warn({ runId, projectId: effectiveProjectId, data }, msg),
      rubricId: resolvedRubricId,
      rubricVersionId: submittedRubricVersion,
      rubric: rubricContent,
    };
    yield { type: "run-started", runId, projectId: effectiveProjectId } satisfies StepEvent;
    yield { type: "progress", stage: "init", pct: 0, message: `Starting ${useCase.label}` } satisfies StepEvent;

    let stepFailed = false;
    for (const step of useCase.pipeline) {
      try {
        for await (const ev of step.run(formData, ctx)) {
          yield ev;
          if (ev.type === "stage-done") ctx.prior[step.id] = ev.data;
          if (ev.type === "error") stepFailed = true;
        }
      } catch (e) {
        const internal = e instanceof Error ? e.message : String(e);
        logger.error({ runId, stage: step.id, error: internal }, "step failed");
        yield { type: "error", stage: step.id, message: "Step failed — check server logs" };
        return;
      }
      if (stepFailed) return;
      if (req.signal.aborted) return;
    }
    const stageKeys = Object.keys(ctx.prior);
    const stageShape = Object.fromEntries(
      stageKeys.map((k) => [
        k,
        ctx.prior[k] && typeof ctx.prior[k] === "object"
          ? Object.keys(ctx.prior[k] as Record<string, unknown>)
          : typeof ctx.prior[k],
      ]),
    );
    logger.info({ runId, useCaseId: id, stageKeys, stageShape }, "pipeline done");
    yield { type: "done", result: ctx.prior };
  });
}
