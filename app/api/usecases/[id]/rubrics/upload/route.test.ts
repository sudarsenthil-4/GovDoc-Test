// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { POST } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import {
  __setRubricsStoreRootForTests,
  listRubrics,
  listVersions,
} from "@/lib/usecases/rubrics-store";

let root: string;

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubric-upload-"));
  __setRubricsStoreRootForTests(root);
});

afterEach(() => {
  __setRubricsStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

const validCmgc = {
  questions: [
    { id: "q1", section: "s", question: "Q?", option_a: "a", option_b: "b", option_c: "c" },
  ],
  weights: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 },
};

async function authedFormReq(form: FormData): Promise<Request> {
  const token = await signSession({ user: "test" });
  return new Request("http://x/upload", {
    method: "POST",
    headers: { cookie: `govdoc_session=${token}` },
    body: form,
  });
}

describe("POST /api/usecases/[id]/rubrics/upload", () => {
  it("creates a new version of an existing rubric", async () => {
    const form = new FormData();
    form.set("mode", "new-version");
    form.set("rubricId", "default");
    form.set("note", "uploaded via UI");
    form.set("file", new File([JSON.stringify(validCmgc)], "rubric.json", { type: "application/json" }));
    const req = await authedFormReq(form);
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.rubricId).toBe("default");
    expect(body.versionId).toMatch(/^v\d{3,}$/);
    const versions = await listVersions("cmgc-pde", "default");
    expect(versions[0]!.source).toBe("upload");
    expect(versions[0]!.note).toBe("uploaded via UI");
  });

  it("creates a brand-new rubric and seeds its first version", async () => {
    const form = new FormData();
    form.set("mode", "new-rubric");
    form.set("rubricId", "pilot");
    form.set("label", "DBE Pilot");
    form.set("file", new File([JSON.stringify(validCmgc)], "rubric.json", { type: "application/json" }));
    const req = await authedFormReq(form);
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(200);
    const list = await listRubrics("cmgc-pde");
    expect(list.some((r) => r.id === "pilot")).toBe(true);
    const versions = await listVersions("cmgc-pde", "pilot");
    expect(versions).toHaveLength(1);
    expect(versions[0]!.source).toBe("upload");
  });

  it("400 when JSON is invalid", async () => {
    const form = new FormData();
    form.set("mode", "new-version");
    form.set("rubricId", "default");
    form.set("file", new File(["not json"], "rubric.json", { type: "application/json" }));
    const req = await authedFormReq(form);
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/JSON/i);
  });

  it("400 when shape validation fails", async () => {
    const form = new FormData();
    form.set("mode", "new-version");
    form.set("rubricId", "default");
    form.set(
      "file",
      new File([JSON.stringify({ questions: [], weights: { A: 1 } })], "rubric.json", {
        type: "application/json",
      }),
    );
    const req = await authedFormReq(form);
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/weights/i);
  });

  it("400 when file is missing", async () => {
    const form = new FormData();
    form.set("mode", "new-version");
    form.set("rubricId", "default");
    const req = await authedFormReq(form);
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(400);
  });
});
