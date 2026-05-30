// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET, POST, DELETE } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import { __setRubricStoreRootForTests } from "@/lib/usecases/rubric-store";

let root: string;

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubric-api-"));
  __setRubricStoreRootForTests(root);
});

afterEach(() => {
  __setRubricStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

async function authedReq(url: string, init: RequestInit = {}): Promise<Request> {
  const token = await signSession({ user: "test" });
  const headers = new Headers(init.headers);
  headers.set("cookie", `govdoc_session=${token}`);
  return new Request(url, { ...init, headers });
}

describe("/api/usecases/[id]/rubric", () => {
  it("GET returns the default rubric when nothing is saved", async () => {
    const req = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric");
    const res = await GET(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.questions)).toBe(true);
    expect(body.weights).toBeDefined();
  });

  it("POST persists a rubric and GET round-trips it", async () => {
    const payload = {
      questions: [{ id: "Z1", section: "Z: Custom", question: "q?", option_a: "a", option_b: "b", option_c: "c" }],
      weights: { A: 1, B: 0, C: 0, D: 0, E: 0, F: 0 },
    };
    const postReq = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const postRes = await POST(postReq, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(postRes.status).toBe(200);

    const getReq = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric");
    const getRes = await GET(getReq, { params: Promise.resolve({ id: "cmgc-pde" }) });
    const body = await getRes.json();
    expect(body.questions[0].id).toBe("Z1");
  });

  it("DELETE clears a saved rubric", async () => {
    const postReq = await authedReq("http://localhost/api/usecases/row-appraisal/rubric", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ "X": { "1": "a", "2": "b", "3": "c", "4": "d", "5": "e" } }),
    });
    await POST(postReq, { params: Promise.resolve({ id: "row-appraisal" }) });

    const delReq = await authedReq("http://localhost/api/usecases/row-appraisal/rubric", { method: "DELETE" });
    const delRes = await DELETE(delReq, { params: Promise.resolve({ id: "row-appraisal" }) });
    expect(delRes.status).toBe(200);

    const getReq = await authedReq("http://localhost/api/usecases/row-appraisal/rubric");
    const getRes = await GET(getReq, { params: Promise.resolve({ id: "row-appraisal" }) });
    const body = await getRes.json();
    // Default ROW schema starts with "Title Page"
    expect(Object.keys(body)).toContain("Title Page");
  });

  it("rejects an unknown use case id with 404", async () => {
    const req = await authedReq("http://localhost/api/usecases/not-real/rubric");
    const res = await GET(req, { params: Promise.resolve({ id: "not-real" }) });
    expect(res.status).toBe(404);
  });

  it("requires authentication", async () => {
    const req = new Request("http://localhost/api/usecases/cmgc-pde/rubric");
    const res = await GET(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(401);
  });
});
