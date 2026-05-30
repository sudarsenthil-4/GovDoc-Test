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
    `http://localhost/api/usecases/cucp-reevals/run/${runId}/level/${n}/approve`,
    {
      method: "POST",
      headers: { cookie: `govdoc_session=${token}`, "content-type": "application/json" },
      body: "{}",
    },
  );
}

describe("POST /api/usecases/cucp-reevals/run/[runId]/level/[n]/approve", () => {
  it("returns 401 without a session", async () => {
    const res = await POST(
      new Request("http://localhost/api/usecases/cucp-reevals/run/r/level/2/approve", {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ runId: "r", n: "2" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when n=3 (L3 uses /finalize)", async () => {
    const req = await authedReq("r", "3");
    const res = await POST(req, { params: Promise.resolve({ runId: "r", n: "3" }) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/level 3 uses \/finalize/);
  });

  it("returns 400 when n=4", async () => {
    const req = await authedReq("r", "4");
    const res = await POST(req, { params: Promise.resolve({ runId: "r", n: "4" }) });
    expect(res.status).toBe(400);
  });

  it("returns 404 when no waiter exists", async () => {
    const req = await authedReq("no-waiter", "2");
    const res = await POST(req, { params: Promise.resolve({ runId: "no-waiter", n: "2" }) });
    expect(res.status).toBe(404);
  });

  it("resolves the L2 waiter with action=approve (200)", async () => {
    const runId = "approve-run";
    const waiter = awaitLevelDecision<{ action: string }>(runId, 2);
    const req = await authedReq(runId, "2");
    const res = await POST(req, { params: Promise.resolve({ runId, n: "2" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    await expect(waiter).resolves.toEqual({ action: "approve" });
  });

  it("resolves the L1 waiter with action=approve (200)", async () => {
    const runId = "approve-l1";
    const waiter = awaitLevelDecision<{ action: string }>(runId, 1);
    const req = await authedReq(runId, "1");
    const res = await POST(req, { params: Promise.resolve({ runId, n: "1" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    await expect(waiter).resolves.toEqual({ action: "approve" });
  });
});
