// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { signSession, verifySession } from "./mock-session";

beforeEach(() => {
  process.env.GOVDOC_SESSION_SECRET = "x".repeat(32);
});

describe("mock-session", () => {
  it("signs and verifies a session", async () => {
    const token = await signSession({ user: "joe" });
    const result = await verifySession(token);
    expect(result).toEqual({ user: "joe" });
  });

  it("returns null for invalid token", async () => {
    expect(await verifySession("garbage")).toBeNull();
  });

  it("returns null for token signed with different secret", async () => {
    const token = await signSession({ user: "joe" });
    process.env.GOVDOC_SESSION_SECRET = "y".repeat(32);
    expect(await verifySession(token)).toBeNull();
  });
});
