// @vitest-environment node

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/tests/mocks/server";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POST as runPOST } from "@/app/api/usecases/[id]/run/route";
import { POST as approveLevelPOST } from "@/app/api/usecases/cucp-reevals/run/[runId]/level/[n]/approve/route";
import { POST as finalizePOST } from "@/app/api/usecases/cucp-reevals/run/[runId]/finalize/route";
import { signSession } from "@/lib/auth/mock-session";
import type { StepEvent } from "@/lib/usecases/types";
import { __clearLevelRendezvous } from "@/lib/runs/level-rendezvous";
import { __setStoreRootForTests } from "@/lib/usecases/cucp-reevals/memory/store";

vi.mock("@/lib/extract/pdf", () => ({
  extractTextFromPdf: async () => "Synthetic CUCP narrative text. Owner faced contracting discrimination in 2024.",
}));

const LEVEL_1_RESPONSE = {
  firm_name: "Acme DBE",
  cross_reference_result: "PASSED — narrative consistent with revenue data",
  narrative_pnw: "$540,000",
  extracted_facts: [
    {
      id: "fact_1",
      when: "2024",
      where: "Bay Area",
      who: "Acme DBE owner",
      what: "Lost prime-contractor recommendation",
      why: "Race-based bias",
      magnitude: "$120,000 contract",
      demographic_flag: true,
      source_quote: "Owner faced contracting discrimination in 2024.",
    },
  ],
};

const LEVEL_2_RESPONSE = {
  classifications: [
    {
      fact_id: "fact_1",
      classification: "Social Disadvantage",
      summary: "Race-based loss of contracting opportunity.",
      reasoning: "Demographic flag + magnitude aligns with §26.67 social-disadvantage criteria.",
    },
  ],
};

const LEVEL_3_RESPONSE = {
  criteria: Array.from({ length: 7 }, (_, i) => ({
    s_no: i + 1,
    category: `Cat ${i + 1}`,
    qualification: `Q ${i + 1}`,
    rule_requires: "rule",
    evidence_summary: "evidence",
    reasoning: "reasoning",
    pass_fail: "Pass",
    request_info: "No",
    confidence: 9.0,
  })),
  final_decision: "Yes",
  certifier_comments: "All seven criteria pass. Recommend continued certification.",
};

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "sk-test-dummy";
});

let storeRoot: string;

beforeEach(() => {
  __clearLevelRendezvous();
  storeRoot = mkdtempSync(join(tmpdir(), "cucp-pipeline-"));
  __setStoreRootForTests(storeRoot);
  let callIndex = 0;
  const responses = [LEVEL_1_RESPONSE, LEVEL_2_RESPONSE, LEVEL_3_RESPONSE];
  mswServer.use(
    http.post("https://api.openai.com/v1/chat/completions", () => {
      const payload = responses[callIndex++ % responses.length];
      return HttpResponse.json({
        id: `chatcmpl-mock-${callIndex}`,
        object: "chat.completion",
        created: 1714867200,
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: JSON.stringify(payload) },
            finish_reason: "stop",
          },
        ],
      });
    }),
  );
});

afterEach(() => {
  mswServer.resetHandlers();
  __clearLevelRendezvous();
  __setStoreRootForTests(null);
  rmSync(storeRoot, { recursive: true, force: true });
});

async function authedRequest(formData: FormData): Promise<Request> {
  const token = await signSession({ user: "test" });
  return new Request("http://localhost/api/usecases/cucp-reevals/run", {
    method: "POST",
    headers: { cookie: `govdoc_session=${token}` },
    body: formData,
  });
}

async function readEventsUntilNeedsInput(
  reader: ReadableStreamDefaultReader<string>,
  events: StepEvent[],
  bufRef: { buf: string },
): Promise<void> {
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    bufRef.buf += value;
    const blocks = bufRef.buf.split("\n\n");
    bufRef.buf = blocks.pop() ?? "";
    for (const b of blocks) {
      if (!b.startsWith("data: ")) continue;
      const ev = JSON.parse(b.slice(6)) as StepEvent;
      events.push(ev);
      if (ev.type === "needs-input") return;
    }
  }
}

async function readEventsUntilDone(
  reader: ReadableStreamDefaultReader<string>,
  events: StepEvent[],
  bufRef: { buf: string },
): Promise<void> {
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    bufRef.buf += value;
    const blocks = bufRef.buf.split("\n\n");
    bufRef.buf = blocks.pop() ?? "";
    for (const b of blocks) {
      if (!b.startsWith("data: ")) continue;
      const ev = JSON.parse(b.slice(6)) as StepEvent;
      events.push(ev);
      if (ev.type === "done" || ev.type === "error") return;
    }
  }
}

describe("CUCP pipeline integration (SSE + per-level rendezvous round-trip)", () => {
  it("pauses at L2 needs-input, resumes via /level/2/approve, pauses at L3, resumes via /finalize, completes with report", async () => {
    const fd = new FormData();
    const fakePdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    fd.append("narrative", new File([fakePdfBuffer], "narrative.pdf", { type: "application/pdf" }));
    fd.append("model", "openai");
    fd.append("projectId", "test-project");

    const req = await authedRequest(fd);
    const res = await runPOST(req, { params: Promise.resolve({ id: "cucp-reevals" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    if (!res.body) throw new Error("no body");

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    const events: StepEvent[] = [];
    const bufRef = { buf: "" };

    // L2 gate
    await readEventsUntilNeedsInput(reader, events, bufRef);
    const runStarted = events.find((e) => e.type === "run-started");
    expect(runStarted).toBeDefined();
    const runId = (runStarted as { type: "run-started"; runId: string }).runId;
    expect(typeof runId).toBe("string");
    expect(runId.length).toBeGreaterThan(0);

    expect(events.some((e) => e.type === "stage-done" && e.stage === "level1")).toBe(true);
    expect(events.some((e) => e.type === "stage-done" && e.stage === "level2")).toBe(true);
    expect(events.at(-1)).toMatchObject({ type: "needs-input", stage: "level2" });

    const continueAfterL2 = readEventsUntilNeedsInput(reader, events, bufRef);
    const approveL2Req = new Request(
      `http://localhost/api/usecases/cucp-reevals/run/${runId}/level/2/approve`,
      {
        method: "POST",
        headers: { cookie: `govdoc_session=${await signSession({ user: "test" })}` },
      },
    );
    const approveL2Res = await approveLevelPOST(approveL2Req, {
      params: Promise.resolve({ runId, n: "2" }),
    });
    expect(approveL2Res.status).toBe(200);
    await continueAfterL2;

    // L3 gate
    expect(events.some((e) => e.type === "stage-done" && e.stage === "level3")).toBe(true);
    expect(events.at(-1)).toMatchObject({ type: "needs-input", stage: "level3" });

    const continueAfterL3 = readEventsUntilDone(reader, events, bufRef);
    const finalizeReq = new Request(
      `http://localhost/api/usecases/cucp-reevals/run/${runId}/finalize`,
      {
        method: "POST",
        headers: { cookie: `govdoc_session=${await signSession({ user: "test" })}` },
      },
    );
    const finalizeRes = await finalizePOST(finalizeReq, {
      params: Promise.resolve({ runId }),
    });
    expect(finalizeRes.status).toBe(200);
    await continueAfterL3;

    const last = events.at(-1);
    expect(last).toMatchObject({ type: "done" });
    const result = (last as { type: "done"; result: Record<string, unknown> }).result;
    expect(result.extract).toBeDefined();
    expect(result.level1).toBeDefined();
    expect(result.level2).toBeDefined();
    expect(result.level3).toBeDefined();
    expect(result.report).toBeDefined();
    const report = result.report as { markdown_report: string };
    expect(report.markdown_report).toContain("CUCP EVALUATION REPORT");
  });
});
