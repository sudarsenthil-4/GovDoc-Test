// @vitest-environment node
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import { __setRubricStoreRootForTests } from "@/lib/usecases/rubric-store";

let root: string;

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET =
    process.env.GOVDOC_SESSION_SECRET ?? "test-secret-32-bytes-min-for-hs256-jose";
});

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubric-dl-"));
  __setRubricStoreRootForTests(root);
});

afterEach(() => {
  __setRubricStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

async function authedReq(url: string): Promise<Request> {
  const token = await signSession({ user: "test" });
  return new Request(url, { headers: { cookie: `govdoc_session=${token}` } });
}

describe("/api/usecases/[id]/rubric/download", () => {
  it("CMGC returns an XLSX with attachment disposition", async () => {
    const req = await authedReq("http://localhost/api/usecases/cmgc-pde/rubric/download");
    const res = await GET(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml");
    expect(res.headers.get("content-disposition")).toContain("cmgc-pde-rubric.xlsx");
    const buf = Buffer.from(await res.arrayBuffer());
    // XLSX is a zip — starts with "PK"
    expect(buf.subarray(0, 2).toString("utf-8")).toBe("PK");
  });

  it("CUCP returns an XLSX with attachment disposition", async () => {
    const req = await authedReq("http://localhost/api/usecases/cucp-reevals/rubric/download");
    const res = await GET(req, { params: Promise.resolve({ id: "cucp-reevals" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml");
    expect(res.headers.get("content-disposition")).toContain("cucp-reevals-rubric.xlsx");
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 2).toString("utf-8")).toBe("PK");
  });

  it("ROW returns an XLSX with attachment disposition", async () => {
    const req = await authedReq("http://localhost/api/usecases/row-appraisal/rubric/download");
    const res = await GET(req, { params: Promise.resolve({ id: "row-appraisal" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheetml");
    expect(res.headers.get("content-disposition")).toContain("row-appraisal-rubric.xlsx");
  });

  it("rejects unknown id with 404", async () => {
    const req = await authedReq("http://localhost/api/usecases/not-real/rubric/download");
    const res = await GET(req, { params: Promise.resolve({ id: "not-real" }) });
    expect(res.status).toBe(404);
  });

  it("requires authentication", async () => {
    const req = new Request("http://localhost/api/usecases/cmgc-pde/rubric/download");
    const res = await GET(req, { params: Promise.resolve({ id: "cmgc-pde" }) });
    expect(res.status).toBe(401);
  });
});
