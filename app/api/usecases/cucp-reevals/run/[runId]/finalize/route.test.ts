// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import { awaitLevelDecision, __clearLevelRendezvous } from "@/lib/runs/level-rendezvous";

beforeEach(() => {
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
  __clearLevelRendezvous();
});
afterEach(() => __clearLevelRendezvous());

async function authedReq(runId: string) {
  const token = await signSession({ user: "joe" });
  return new Request(`http://localhost/api/usecases/cucp-reevals/run/${runId}/finalize`, {
    method: "POST",
    headers: { cookie: `govdoc_session=${token}`, "content-type": "application/json" },
    body: "{}",
  });
}

describe("POST /api/usecases/cucp-reevals/run/[runId]/finalize", () => {
  it("returns 401 without a session", async () => {
    const res = await POST(
      new Request("http://localhost/api/usecases/cucp-reevals/run/r/finalize", {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ runId: "r" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when no L3 waiter exists", async () => {
    const req = await authedReq("no-waiter");
    const res = await POST(req, { params: Promise.resolve({ runId: "no-waiter" }) });
    expect(res.status).toBe(404);
  });

  it("resolves the L3 waiter with action=approve (200)", async () => {
    const runId = "finalize-run";
    const waiter = awaitLevelDecision<{ action: string }>(runId, 3);
    const req = await authedReq(runId);
    const res = await POST(req, { params: Promise.resolve({ runId }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    await expect(waiter).resolves.toEqual({ action: "approve" });
  });

  it("does not resolve L2 waiter (only L3)", async () => {
    const runId = "finalize-only-l3";
    const l2Waiter = awaitLevelDecision<{ action: string }>(runId, 2);
    let l2Resolved = false;
    void l2Waiter.then(() => {
      l2Resolved = true;
    });
    const req = await authedReq(runId);
    const res = await POST(req, { params: Promise.resolve({ runId }) });
    expect(res.status).toBe(404);
    expect(l2Resolved).toBe(false);
  });
});
