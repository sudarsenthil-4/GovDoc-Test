// @vitest-environment node

import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/tests/mocks/server";
import { POST } from "@/app/api/usecases/[id]/run/route";
import { signSession } from "@/lib/auth/mock-session";
import { collectSseEvents } from "@/tests/utils/sse";

const FIXTURES_DIR = path.resolve(__dirname, "../fixtures/cmgc");
const DOCX = path.join(FIXTURES_DIR, "synthetic-narrative.docx");
const SNAPSHOT_FILE = path.join(FIXTURES_DIR, "llm-snapshots/openai-evaluate-default.json");

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
  process.env.GOVDOC_DEV_USER = process.env.GOVDOC_DEV_USER ?? "test";
  process.env.GOVDOC_DEV_PASS = process.env.GOVDOC_DEV_PASS ?? "test";
  // Dummy key — MSW intercepts before any real HTTP call is made
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "sk-test-dummy";
  // MSW server is already listening via tests/setup.ts; just confirm fixture exists
  const buf = readFileSync(DOCX);
  if (!buf || buf.byteLength === 0) throw new Error("synthetic-narrative.docx fixture missing");
});

beforeEach(() => {
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf8"));
  mswServer.use(
    http.post("https://api.openai.com/v1/chat/completions", async ({ request }) => {
      const body = (await request.json()) as { messages: { role: string; content: string }[] };
      const sys = body.messages?.[0]?.content ?? "";
      if (typeof sys === "string" && sys.includes("Senior Alternative Contracting Expert")) {
        return HttpResponse.json(snapshot);
      }
      // score-step gpt-4o-mini key-factors call
      return HttpResponse.json({
        id: "chatcmpl-mock-keyfactors",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Two-sentence explanation of why this method fits.",
            },
            finish_reason: "stop",
          },
        ],
      });
    }),
  );
});

afterEach(() => {
  mswServer.resetHandlers();
});

async function makeReq(formData: FormData): Promise<Request> {
  const token = await signSession({ user: "test" });
  return new Request("http://localhost/api/usecases/cmgc-pde/run", {
    method: "POST",
    headers: { cookie: `govdoc_session=${token}` },
    body: formData,
  });
}

describe("CMGC pipeline integration", () => {
  it("streams progress → 4 stage-done events → done", async () => {
    const buf = readFileSync(DOCX);
    const fd = new FormData();
    fd.append("factSheet", new File([buf], "synthetic-narrative.docx"));
    fd.append("projectName", "I-880 Test");
    fd.append("provider", "openai");

    const req = await makeReq(fd);
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const events = await collectSseEvents(res);

    // First event announces the runId; second is init progress
    expect(events[0]).toMatchObject({ type: "run-started" });
    expect(events[1]).toMatchObject({ type: "progress", stage: "init", pct: 0 });

    // Each pipeline stage emits exactly one stage-done event
    const stageDoneEvents = events.filter((e) => e.type === "stage-done");
    expect(stageDoneEvents.length).toBeGreaterThanOrEqual(4);
    const stageDoneIds = stageDoneEvents
      .map((e) => (e as { type: "stage-done"; stage: string }).stage)
      .filter((s) => s !== "init");
    expect(stageDoneIds).toEqual(
      expect.arrayContaining(["extract", "evaluate", "score", "validate"]),
    );

    // Last event is done with the accumulated result
    const last = events.at(-1);
    expect(last).toMatchObject({ type: "done" });
    const result = (
      last as {
        type: "done";
        result: { extract?: unknown; evaluate?: unknown; score?: unknown; validate?: unknown };
      }
    ).result;
    expect(result.extract).toBeDefined();
    expect(result.evaluate).toBeDefined();
    expect(result.score).toBeDefined();
    expect(result.validate).toBeNull(); // no district ratings supplied
  });

  it("score result.composite_score is in [1.0, 3.0]", async () => {
    const buf = readFileSync(DOCX);
    const fd = new FormData();
    fd.append("factSheet", new File([buf], "synthetic-narrative.docx"));
    fd.append("provider", "openai");

    const req = await makeReq(fd);
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    const events = await collectSseEvents(res);

    const done = events.find((e) => e.type === "done");
    expect(done).toBeDefined();
    const score = (
      done as {
        result: { score: { recommendation: { composite_score: number; recommended_method: string } } };
      }
    ).result.score;
    expect(score.recommendation.composite_score).toBeGreaterThanOrEqual(1.0);
    expect(score.recommendation.composite_score).toBeLessThanOrEqual(3.0);
    expect(typeof score.recommendation.recommended_method).toBe("string");
    expect(score.recommendation.recommended_method.length).toBeGreaterThan(0);
  });

  it("returns 401 without a session cookie", async () => {
    const fd = new FormData();
    fd.append("factSheet", new File([readFileSync(DOCX)], "synthetic-narrative.docx"));
    fd.append("provider", "openai");

    const req = new Request("http://localhost/api/usecases/cmgc-pde/run", {
      method: "POST",
      body: fd,
    });
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(401);
  });
});
