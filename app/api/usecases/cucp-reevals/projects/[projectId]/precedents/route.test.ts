// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET, DELETE } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import {
  __setStoreRootForTests,
  commitStagedPrecedents,
  loadPrecedents,
} from "@/lib/usecases/cucp-reevals/memory/store";
import type { PrecedentsByLevel } from "@/lib/usecases/cucp-reevals/memory/precedents";

let root: string;

beforeEach(() => {
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
  root = mkdtempSync(join(tmpdir(), "cucp-precedents-route-test-"));
  __setStoreRootForTests(root);
});

afterEach(() => {
  __setStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

const sample: PrecedentsByLevel = {
  level_1_precedents: [
    { target: "Narrative PNW", correction: "1500000", human_reasoning: "Round to dollar" },
  ],
  level_2_precedents: [
    {
      target: "Lost contract",
      correction: "Ordinary Business Risk",
      human_reasoning: "Pricing not §26.67",
      fact_id: "fact_3",
    },
    {
      target: "Health issue",
      correction: "Social Disadvantage",
      human_reasoning: "Per §26.67",
      fact_id: "fact_5",
    },
  ],
  level_3_precedents: [],
};

async function authedGet(projectId: string) {
  const token = await signSession({ user: "joe" });
  return new Request(`http://localhost/api/usecases/cucp-reevals/projects/${projectId}/precedents`, {
    method: "GET",
    headers: { cookie: `govdoc_session=${token}` },
  });
}

async function authedDelete(projectId: string, body: unknown, asJson = true) {
  const token = await signSession({ user: "joe" });
  return new Request(`http://localhost/api/usecases/cucp-reevals/projects/${projectId}/precedents`, {
    method: "DELETE",
    headers: { cookie: `govdoc_session=${token}`, "content-type": "application/json" },
    body: asJson ? JSON.stringify(body) : (body as string),
  });
}

describe("GET /api/usecases/cucp-reevals/projects/[projectId]/precedents", () => {
  it("returns 401 without a session", async () => {
    const res = await GET(
      new Request("http://localhost/api/usecases/cucp-reevals/projects/p/precedents"),
      { params: Promise.resolve({ projectId: "p" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty arrays for unknown project", async () => {
    const req = await authedGet("never-seen");
    const res = await GET(req, { params: Promise.resolve({ projectId: "never-seen" }) });
    expect(res.status).toBe(200);
    const json = (await res.json()) as PrecedentsByLevel;
    expect(json).toEqual({
      level_1_precedents: [],
      level_2_precedents: [],
      level_3_precedents: [],
    });
  });

  it("returns 200 with committed data", async () => {
    await commitStagedPrecedents("proj-a", sample);
    const req = await authedGet("proj-a");
    const res = await GET(req, { params: Promise.resolve({ projectId: "proj-a" }) });
    expect(res.status).toBe(200);
    const json = (await res.json()) as PrecedentsByLevel;
    expect(json.level_1_precedents).toHaveLength(1);
    expect(json.level_2_precedents).toHaveLength(2);
    expect(json.level_3_precedents).toHaveLength(0);
  });

  it("returns 400 for an invalid projectId (path traversal)", async () => {
    const req = await authedGet("../evil");
    const res = await GET(req, { params: Promise.resolve({ projectId: "../evil" }) });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/usecases/cucp-reevals/projects/[projectId]/precedents", () => {
  it("returns 401 without a session", async () => {
    const res = await DELETE(
      new Request("http://localhost/api/usecases/cucp-reevals/projects/p/precedents", {
        method: "DELETE",
        body: "{}",
      }),
      { params: Promise.resolve({ projectId: "p" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid JSON body", async () => {
    const req = await authedDelete("proj-a", "{not json", false);
    const res = await DELETE(req, { params: Promise.resolve({ projectId: "proj-a" }) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/Invalid JSON body/);
  });

  it("returns 400 when level is not 1/2/3", async () => {
    const req = await authedDelete("proj-a", { level: 4, index: 0 });
    const res = await DELETE(req, { params: Promise.resolve({ projectId: "proj-a" }) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/level must be 1, 2, or 3/);
  });

  it("returns 400 when index is negative", async () => {
    const req = await authedDelete("proj-a", { level: 2, index: -1 });
    const res = await DELETE(req, { params: Promise.resolve({ projectId: "proj-a" }) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toMatch(/non-negative integer/);
  });

  it("returns 400 when index is not an integer", async () => {
    const req = await authedDelete("proj-a", { level: 2, index: 1.5 });
    const res = await DELETE(req, { params: Promise.resolve({ projectId: "proj-a" }) });
    expect(res.status).toBe(400);
  });

  it("deletes the entry and returns 200; subsequent GET reflects the change", async () => {
    await commitStagedPrecedents("proj-a", sample);
    const before = await loadPrecedents("proj-a");
    expect(before.level_2_precedents).toHaveLength(2);

    const req = await authedDelete("proj-a", { level: 2, index: 0 });
    const res = await DELETE(req, { params: Promise.resolve({ projectId: "proj-a" }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const getReq = await authedGet("proj-a");
    const getRes = await GET(getReq, { params: Promise.resolve({ projectId: "proj-a" }) });
    const json = (await getRes.json()) as PrecedentsByLevel;
    expect(json.level_2_precedents).toHaveLength(1);
    expect(json.level_2_precedents[0]?.fact_id).toBe("fact_5");
  });

  it("returns 400 for an invalid projectId (path traversal)", async () => {
    const req = await authedDelete("../evil", { level: 1, index: 0 });
    const res = await DELETE(req, { params: Promise.resolve({ projectId: "../evil" }) });
    expect(res.status).toBe(400);
  });
});
