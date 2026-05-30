// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET, POST } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import { __setRubricsStoreRootForTests } from "@/lib/usecases/rubrics-store";

let root: string;

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubrics-api-"));
  __setRubricsStoreRootForTests(root);
});

afterEach(() => {
  __setRubricsStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

async function authedReq(url: string, init: RequestInit = {}): Promise<Request> {
  const token = await signSession({ user: "test" });
  const headers = new Headers(init.headers);
  headers.set("cookie", `govdoc_session=${token}`);
  return new Request(url, { ...init, headers });
}

describe("/api/usecases/[id]/rubrics", () => {
  it("GET lists the manifest (default entry seeded on first read)", async () => {
    const req = await authedReq("http://localhost/api/usecases/cmgc-pde/rubrics");
    const res = await GET(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rubrics).toHaveLength(1);
    expect(body.rubrics[0].id).toBe("default");
    expect(body.rubrics[0].isDefault).toBe(true);
  });

  it("POST creates a new rubric without cloning when cloneFrom is omitted", async () => {
    const req = await authedReq("http://localhost/api/usecases/cmgc-pde/rubrics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "pilot", label: "Pilot rubric" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entry.id).toBe("pilot");
    expect(body.entry.isDefault).toBe(false);
  });

  it("POST rejects a body missing id or label", async () => {
    const req = await authedReq("http://localhost/api/usecases/cmgc-pde/rubrics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "pilot" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(400);
  });

  it("POST rejects a duplicate rubric id with 400", async () => {
    const req1 = await authedReq("http://localhost/api/usecases/cmgc-pde/rubrics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "default", label: "Re-default" }),
    });
    const res = await POST(req1, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already exists/);
  });

  it("rejects an unknown use case id with 404", async () => {
    const req = await authedReq("http://localhost/api/usecases/nope/rubrics");
    const res = await GET(req, { params: Promise.resolve({ id: "nope" }) });
    expect(res.status).toBe(404);
  });

  it("requires authentication", async () => {
    const req = new Request("http://localhost/api/usecases/cmgc-pde/rubrics");
    const res = await GET(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(401);
  });
});
