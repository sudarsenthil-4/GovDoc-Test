// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { signSession } from "@/lib/auth/mock-session";
import { middleware } from "./middleware";

beforeEach(() => {
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
});

function reqAt(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", `govdoc_session=${cookie}`);
  return new NextRequest(new URL("http://localhost" + path), { headers });
}

describe("middleware", () => {
  it("allows /login through", async () => {
    const res = await middleware(reqAt("/login"));
    expect(res.status).not.toBe(307);
  });

  it("allows /api/auth/login through", async () => {
    const res = await middleware(reqAt("/api/auth/login"));
    expect(res.status).not.toBe(307);
  });

  it("redirects unauthenticated /workspace to /login", async () => {
    const res = await middleware(reqAt("/workspace"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows authenticated /workspace through", async () => {
    const token = await signSession({ user: "joe" });
    const res = await middleware(reqAt("/workspace", token));
    expect(res.status).not.toBe(307);
  });

  it("redirects /workspace on tampered cookie", async () => {
    const res = await middleware(reqAt("/workspace", "garbage"));
    expect(res.status).toBe(307);
  });

  it("/api/health is public — no cookie, no redirect", async () => {
    const res = await middleware(reqAt("/api/health"));
    expect(res.status).not.toBe(307);
  });
});
