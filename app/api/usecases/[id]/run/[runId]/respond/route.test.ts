// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import { waitForHumanResponse, __clearRendezvous } from "@/lib/runs/needs-input-rendezvous";

beforeEach(() => {
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
  __clearRendezvous();
});
afterEach(() => __clearRendezvous());

async function authedReq(id: string, runId: string, body: unknown) {
  const token = await signSession({ user: "joe" });
  return new Request(`http://localhost/api/usecases/${id}/run/${runId}/respond`, {
    method: "POST",
    headers: { cookie: `govdoc_session=${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/usecases/[id]/run/[runId]/respond", () => {
  it("returns 401 without a session", async () => {
    const res = await POST(
      new Request("http://localhost/api/usecases/x/run/r/respond", { method: "POST", body: "{}" }),
      { params: Promise.resolve({ id: "x", runId: "r" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when no rendezvous exists for the runId", async () => {
    const req = await authedReq("cucp-reevals", "no-such-run", { overrides: [] });
    const res = await POST(req, { params: Promise.resolve({ id: "cucp-reevals", runId: "no-such-run" }) });
    expect(res.status).toBe(404);
  });

  it("returns 200 and resolves the awaiting promise with the body", async () => {
    const runId = "happy-run";
    const waitPromise = waitForHumanResponse<{ overrides: number[] }>(runId);
    const body = { overrides: [3, 5] };
    const req = await authedReq("cucp-reevals", runId, body);
    const res = await POST(req, { params: Promise.resolve({ id: "cucp-reevals", runId }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
    await expect(waitPromise).resolves.toEqual(body);
  });
});
