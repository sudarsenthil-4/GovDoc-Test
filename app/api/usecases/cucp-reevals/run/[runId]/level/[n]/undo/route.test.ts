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

async function authedReq(runId: string, n: string) {
  const token = await signSession({ user: "joe" });
  return new Request(
    `http://localhost/api/usecases/cucp-reevals/run/${runId}/level/${n}/undo`,
    { method: "POST", headers: { cookie: `govdoc_session=${token}` }, body: "{}" },
  );
}

describe("POST /api/usecases/cucp-reevals/run/[runId]/level/[n]/undo", () => {
  it("returns 401 without a session", async () => {
    const res = await POST(
      new Request("http://localhost/api/usecases/cucp-reevals/run/r/level/1/undo", { method: "POST" }),
      { params: Promise.resolve({ runId: "r", n: "1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when n != 1 (only L1 supports undo)", async () => {
    const req = await authedReq("r", "2");
    const res = await POST(req, { params: Promise.resolve({ runId: "r", n: "2" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when no waiter exists", async () => {
    const req = await authedReq("nope", "1");
    const res = await POST(req, { params: Promise.resolve({ runId: "nope", n: "1" }) });
    expect(res.status).toBe(404);
  });

  it("resolves the L1 waiter with action=undo (200)", async () => {
    const runId = "undo-run";
    const waiter = awaitLevelDecision<{ action: string }>(runId, 1);
    const req = await authedReq(runId, "1");
    const res = await POST(req, { params: Promise.resolve({ runId, n: "1" }) });
    expect(res.status).toBe(200);
    await expect(waiter).resolves.toEqual({ action: "undo" });
  });
});
