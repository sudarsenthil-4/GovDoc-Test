// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DELETE } from "./route";
import { POST as POST_LIST } from "../route";
import { signSession } from "@/lib/auth/mock-session";
import { __setRubricsStoreRootForTests } from "@/lib/usecases/rubrics-store";

let root: string;

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubrics-delete-"));
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

describe("DELETE /api/usecases/[id]/rubrics/[rubricId]", () => {
  it("removes a non-default rubric", async () => {
    // Seed a second rubric so we have something to delete.
    const create = await authedReq("http://localhost/api/usecases/cmgc-pde/rubrics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "pilot", label: "Pilot" }),
    });
    await POST_LIST(create, { params: Promise.resolve({ id: "cmgc-pde" }) });

    const req = await authedReq(
      "http://localhost/api/usecases/cmgc-pde/rubrics/pilot",
      { method: "DELETE" },
    );
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "pilot" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rubrics.some((r: { id: string }) => r.id === "pilot")).toBe(false);
  });

  it("refuses to delete the default rubric with 400", async () => {
    const req = await authedReq(
      "http://localhost/api/usecases/cmgc-pde/rubrics/default",
      { method: "DELETE" },
    );
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the rubric id does not exist", async () => {
    const req = await authedReq(
      "http://localhost/api/usecases/cmgc-pde/rubrics/ghost",
      { method: "DELETE" },
    );
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "ghost" }),
    });
    expect(res.status).toBe(404);
  });
});
