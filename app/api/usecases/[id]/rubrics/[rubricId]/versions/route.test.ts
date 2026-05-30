// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET } from "./route";
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
  root = mkdtempSync(join(tmpdir(), "rubric-versions-api-"));
  __setRubricsStoreRootForTests(root);
});

afterEach(() => {
  __setRubricsStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

async function authedReq(url: string): Promise<Request> {
  const token = await signSession({ user: "test" });
  return new Request(url, { headers: { cookie: `govdoc_session=${token}` } });
}

describe("/api/usecases/[id]/rubrics/[rubricId]/versions", () => {
  it("401 without a session", async () => {
    const res = await GET(new Request("http://x/v"), {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "default" }),
    });
    expect(res.status).toBe(401);
  });

  it("404 for an unknown use case", async () => {
    const req = await authedReq("http://x/v");
    const res = await GET(req, { params: Promise.resolve({ id: "nope", rubricId: "default" }) });
    expect(res.status).toBe(404);
  });

  it("returns versions newest-first after two saves", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await saveRubric("cmgc-pde", "default", { v: 2 }, { source: "edit", note: "tightened" });
    const req = await authedReq("http://x/v");
    const res = await GET(req, { params: Promise.resolve({ id: "cmgc-pde", rubricId: "default" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.versions).toHaveLength(2);
    expect(body.versions[0].id).toBe("v002");
    expect(body.versions[0].note).toBe("tightened");
  });
});
