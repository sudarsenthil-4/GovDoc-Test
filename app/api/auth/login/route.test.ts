// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "./route";

beforeEach(() => {
  process.env.GOVDOC_DEV_USER = "joe";
  process.env.GOVDOC_DEV_PASS = "secret";
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
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
