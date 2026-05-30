// @vitest-environment node

import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/tests/mocks/server";
import { POST as runPOST } from "@/app/api/usecases/[id]/run/route";
import { signSession } from "@/lib/auth/mock-session";
import { VALID_CATEGORIES } from "@/lib/usecases/row-appraisal/data/valid-categories";
import type { StepEvent } from "@/lib/usecases/types";
import type { RowRunResult } from "@/lib/usecases/row-appraisal/types";

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "sk-test-dummy";
});

// Cycles through scores so each category gets a plausible value
const SCORE_CYCLE = [5, 4, 3, "N/A", 2] as const;

beforeEach(() => {
  let callCount = 0;

  mswServer.use(
    http.post("https://api.openai.com/v1/chat/completions", async ({ request }) => {
      callCount++;
      const body = (await request.json()) as { messages: { role: string; content: string }[] };

      // Find the last user message (which contains the category list)
      const userMsg = [...body.messages].reverse().find((m) => m.role === "user");
      const userContent = userMsg?.content ?? "";

      // Extract category names from lines like "- Category Name"
      const categories: string[] = [];
      for (const match of userContent.matchAll(/^- (.+)$/gm)) {
        categories.push(match[1]!.trim());
      }

      // Build one EvaluationResult per category
      const results = categories.map((category, idx) => {
        const score = SCORE_CYCLE[idx % SCORE_CYCLE.length];
        const isNa = score === "N/A";
        return {
          category,
          score,
          criteria_met: isNa ? "Not applicable" : `Score ${score} criteria met`,
          evidence: isNa ? "Not applicable" : `Evidence found on page ${idx + 1}`,
          status: isNa ? "⚪ N/A" : "✅ Pass",
          comments: isNa ? "Category does not apply" : `Chunk call ${callCount}, cat ${idx + 1}`,
        };
      });

      return HttpResponse.json({
        id: `chatcmpl-mock-${callCount}`,
        object: "chat.completion",
        created: 1714867200,
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: JSON.stringify(results) },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 500, completion_tokens: 200 },
      });
    }),
  );
});

afterEach(() => {
  mswServer.resetHandlers();
});

async function readSseEvents(res: Response): Promise<StepEvent[]> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events: StepEvent[] = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
      if (dataLine) events.push(JSON.parse(dataLine.slice(6)) as StepEvent);
    }
  }

  return events;
}

describe("ROW appraisal pipeline integration (SSE end-to-end)", () => {
  it("streams all pipeline stages and produces 34 evaluation results", async () => {
    // Build FormData with a synthetic PDF file (bytes don't matter; bundled markdown is loaded by filename)
    const fd = new FormData();
    const fakePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"
    fd.append(
      "pdf",
      new File([fakePdfBytes], "Appraisal_EA2F590_Parcel_36668.pdf", { type: "application/pdf" }),
    );
    fd.append("model", "openai");

    // Build an authenticated request
    const token = await signSession({ user: "test-user" });
    const req = new Request("http://localhost/api/usecases/row-appraisal/run", {
      method: "POST",
      headers: { cookie: `govdoc_session=${token}` },
      body: fd,
    });

    const res = await runPOST(req, { params: Promise.resolve({ id: "row-appraisal" }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.body).toBeTruthy();

    const events = await readSseEvents(res);

    // ── Event sequence assertions ──────────────────────────────────────────────

    const types = events.map((e) => e.type);

    // run-started first
    expect(types[0]).toBe("run-started");

    // progress(init) second
    const initProgress = events.find(
      (e) => e.type === "progress" && (e as { type: "progress"; stage: string }).stage === "init",
    );
    expect(initProgress).toBeDefined();

    // extract stage
    expect(events.some((e) => e.type === "progress" && (e as any).stage === "extract")).toBe(true);
    expect(events.some((e) => e.type === "stage-done" && (e as any).stage === "extract")).toBe(true);

    // evaluate: 5 chunk progress + 1 vision-fallback progress + 5 partial events
    const evaluateProgress = events.filter(
      (e) => e.type === "progress" && (e as any).stage === "evaluate",
    );
    const evaluatePartial = events.filter(
      (e) => e.type === "partial" && (e as any).stage === "evaluate",
    );
    expect(evaluateProgress.length).toBe(6);
    expect(evaluatePartial.length).toBe(5);
    expect(
      evaluateProgress.some((e) => (e as any).message?.includes("vision")),
    ).toBe(true);
    expect(events.some((e) => e.type === "stage-done" && (e as any).stage === "evaluate")).toBe(true);

    // consolidate stage
    expect(
      events.some((e) => e.type === "progress" && (e as any).stage === "consolidate"),
    ).toBe(true);
    expect(
      events.some((e) => e.type === "stage-done" && (e as any).stage === "consolidate"),
    ).toBe(true);

    // done event last
    const lastEvent = events.at(-1);
    expect(lastEvent?.type).toBe("done");

    // ── Result assertions ──────────────────────────────────────────────────────

    const doneEvent = lastEvent as { type: "done"; result: Record<string, unknown> };
    const consolidate = doneEvent.result.consolidate as RowRunResult;

    expect(consolidate).toBeDefined();
    expect(consolidate.evaluation_results.length).toBe(34);
    expect(consolidate.markdown_table).toMatch(/^\| Category \| Score \|/);

    // All 34 VALID_CATEGORIES must appear in results
    const foundCategories = new Set(consolidate.evaluation_results.map((r) => r.category));
    for (const cat of VALID_CATEGORIES) {
      expect(foundCategories.has(cat), `Missing category: ${cat}`).toBe(true);
    }

    // No error events
    expect(events.some((e) => e.type === "error")).toBe(false);
  }, 30_000);
});
