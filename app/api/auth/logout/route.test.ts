import { describe, it, expect } from "vitest";
import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  it("clears session cookie and redirects to /login", async () => {
    const res = await POST();
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/login");
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("govdoc_session=");
    expect(setCookie).toMatch(/Max-Age=0|Expires=/);
  });
});
