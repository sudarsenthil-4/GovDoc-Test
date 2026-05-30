// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";
import { signSession } from "@/lib/auth/mock-session";
// @ts-expect-error -- TS6133: collectSseEvents used in future happy-path tests (Plans 2/3/4)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { collectSseEvents } from "@/tests/utils/sse";

beforeEach(() => {
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
});

async function authedReq(id: string) {
  const token = await signSession({ user: "joe" });
  return new Request(`http://localhost/api/usecases/${id}/run`, {
    method: "POST",
    headers: { cookie: `govdoc_session=${token}` },
    body: new FormData(),
  });
}

describe("POST /api/usecases/[id]/run", () => {
  it("returns 401 without session", async () => {
    const res = await POST(new Request("http://localhost/api/usecases/x/run", { method: "POST", body: new FormData() }), { params: Promise.resolve({ id: "x" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown use case", async () => {
    const res = await POST(await authedReq("nope"), { params: Promise.resolve({ id: "nope" }) });
    expect(res.status).toBe(404);
  });
});
