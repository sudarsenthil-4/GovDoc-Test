// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET, DELETE } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import {
  __setRubricsStoreRootForTests,
  saveRubric,
} from "@/lib/usecases/rubrics-store";

let root: string;

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubric-version-load-"));
  __setRubricsStoreRootForTests(root);
});

afterEach(() => {
  __setRubricsStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

async function authedReq(): Promise<Request> {
  const token = await signSession({ user: "test" });
  return new Request("http://x/v/v001", { headers: { cookie: `govdoc_session=${token}` } });
}

describe("/api/usecases/[id]/rubrics/[rubricId]/versions/[versionId]", () => {
  it("returns the snapshot content", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await saveRubric("cmgc-pde", "default", { v: 2 });
    const req = await authedReq();
    const res = await GET(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default", versionId: "v001" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ v: 1 });
  });

  it("404 for an unknown version", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    const req = await authedReq();
    const res = await GET(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default", versionId: "v999" }),
    });
    expect(res.status).toBe(404);
  });

  it("400 for an unsafe version id shape", async () => {
    const req = await authedReq();
    const res = await GET(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default", versionId: "../etc/passwd" }),
    });
    expect(res.status).toBe(400);
  });
});

async function authedDeleteReq(): Promise<Request> {
  const token = await signSession({ user: "test" });
  return new Request("http://x/v/v001", {
    method: "DELETE",
    headers: { cookie: `govdoc_session=${token}` },
  });
}

describe("DELETE .../versions/[versionId]", () => {
  it("204 removes a non-newest version", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await saveRubric("cmgc-pde", "default", { v: 2 });
    await saveRubric("cmgc-pde", "default", { v: 3 });
    const req = await authedDeleteReq();
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default", versionId: "v002" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("400 when deleting the newest version", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await saveRubric("cmgc-pde", "default", { v: 2 });
    const req = await authedDeleteReq();
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default", versionId: "v002" }),
    });
    expect(res.status).toBe(400);
  });

  it("404 for unknown version", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await saveRubric("cmgc-pde", "default", { v: 2 });
    const req = await authedDeleteReq();
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default", versionId: "v099" }),
    });
    expect(res.status).toBe(404);
  });

  it("401 without a session", async () => {
    const res = await DELETE(new Request("http://x/v", { method: "DELETE" }), {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default", versionId: "v001" }),
    });
    expect(res.status).toBe(401);
  });
});
