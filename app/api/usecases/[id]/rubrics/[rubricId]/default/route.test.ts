// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PATCH } from "./route";
import { POST as POST_LIST } from "../../route";
import { signSession } from "@/lib/auth/mock-session";
import { __setRubricsStoreRootForTests } from "@/lib/usecases/rubrics-store";

let root: string;

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubrics-default-"));
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

describe("PATCH /api/usecases/[id]/rubrics/[rubricId]/default", () => {
  it("flips the default flag to the named rubric", async () => {
    const create = await authedReq("http://localhost/api/usecases/cmgc-pde/rubrics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "pilot", label: "Pilot" }),
    });
    await POST_LIST(create, { params: Promise.resolve({ id: "cmgc-pde" }) });

    const req = await authedReq(
      "http://localhost/api/usecases/cmgc-pde/rubrics/pilot/default",
      { method: "PATCH" },
    );
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "pilot" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    const pilot = body.rubrics.find((r: { id: string }) => r.id === "pilot");
    const def = body.rubrics.find((r: { id: string }) => r.id === "default");
    expect(pilot.isDefault).toBe(true);
    expect(def.isDefault).toBe(false);
  });

  it("returns 404 when the rubric id is unknown", async () => {
    const req = await authedReq(
      "http://localhost/api/usecases/cmgc-pde/rubrics/ghost/default",
      { method: "PATCH" },
    );
    const res = await PATCH(req, {
      params: Promise.resolve({ id: "cmgc-pde", rubricId: "ghost" }),
    });
    expect(res.status).toBe(404);
  });
});
