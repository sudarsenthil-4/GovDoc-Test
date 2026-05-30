// @vitest-environment node

import { describe, it, expect, beforeAll } from "vitest";
import { POST } from "./route";
import { signSession } from "@/lib/auth/mock-session";
import { mockRunResult } from "@/lib/usecases/cmgc-pde/scoring/fixtures";

beforeAll(() => {
  process.env.GOVDOC_SESSION_SECRET ??= "test-secret-32-bytes-min-for-hs256-jose";
});

describe("export route", () => {
  it("returns 401 without session", async () => {
    const req = new Request("http://localhost/api/usecases/cmgc-pde/export/xlsx", {
      method: "POST",
      body: JSON.stringify(mockRunResult()),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde", exporter: "xlsx" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown use case", async () => {
    const token = await signSession({ user: "test" });
    const req = new Request("http://localhost/api/usecases/nope/export/xlsx", {
      method: "POST",
      headers: { cookie: `govdoc_session=${token}` },
      body: JSON.stringify(mockRunResult()),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "nope", exporter: "xlsx" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown exporter", async () => {
    const token = await signSession({ user: "test" });
    const req = new Request("http://localhost/api/usecases/cmgc-pde/export/pdf", {
      method: "POST",
      headers: { cookie: `govdoc_session=${token}` },
      body: JSON.stringify(mockRunResult()),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde", exporter: "pdf" }) });
    expect(res.status).toBe(404);
  });

  it("returns 200 with xlsx bytes (ZIP magic)", async () => {
    const token = await signSession({ user: "test" });
    const req = new Request("http://localhost/api/usecases/cmgc-pde/export/xlsx", {
      method: "POST",
      headers: { cookie: `govdoc_session=${token}` },
      body: JSON.stringify(mockRunResult()),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "cmgc-pde", exporter: "xlsx" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("spreadsheet");
    expect(res.headers.get("content-disposition")).toContain(".xlsx");
    const ab = await res.arrayBuffer();
    const u8 = new Uint8Array(ab);
    expect(u8[0]).toBe(0x50);  // ZIP magic
    expect(u8[1]).toBe(0x4b);
  });
});
