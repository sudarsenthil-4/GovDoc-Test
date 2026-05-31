// @vitest-environment node
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "govdoc-auth-"));
  process.env.GOVDOC_AUTH_FILE = path.join(tempDir, "auth.local.json");
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
  await writeFile(
    process.env.GOVDOC_AUTH_FILE,
    JSON.stringify({
      users: [{ uid: "joe", password: "secret", name: "Joe", role: "admin" }],
    }),
  );
});

afterEach(async () => {
  delete process.env.GOVDOC_AUTH_FILE;
  await rm(tempDir, { force: true, recursive: true });
});

function makeReq(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/login", () => {
  it("rejects bad creds with 401", async () => {
    const res = await POST(makeReq({ username: "joe", password: "wrong" }));
    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).not.toMatch(/secret|wrong|joe/);
  });

  it("accepts good creds, sets cookie", async () => {
    const res = await POST(makeReq({ username: "joe", password: "secret" }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("govdoc_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");
  });
});
