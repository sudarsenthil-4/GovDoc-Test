import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns 200 with ok=true and the service name", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe("govdoc");
    expect(typeof body.uptimeSec).toBe("number");
  });

  it("includes commit when GIT_COMMIT is set", async () => {
    process.env.GIT_COMMIT = "abc1234";
    const res = await GET();
    const body = await res.json();
    expect(body.commit).toBe("abc1234");
    delete process.env.GIT_COMMIT;
  });

  it("omits commit when GIT_COMMIT is unset", async () => {
    delete process.env.GIT_COMMIT;
    const res = await GET();
    const body = await res.json();
    expect(body.commit).toBeUndefined();
    expect(body.dirty).toBeUndefined();
    expect(body.warning).toBeUndefined();
  });

  it("flags dirty=true and a warning when GIT_COMMIT ends with -dirty", async () => {
    process.env.GIT_COMMIT = "abc1234-dirty";
    const res = await GET();
    const body = await res.json();
    expect(body.commit).toBe("abc1234-dirty");
    expect(body.dirty).toBe(true);
    expect(body.warning).toMatch(/dirty working tree/i);
    delete process.env.GIT_COMMIT;
  });

  it("does NOT set dirty for a clean commit", async () => {
    process.env.GIT_COMMIT = "abc1234";
    const res = await GET();
    const body = await res.json();
    expect(body.commit).toBe("abc1234");
    expect(body.dirty).toBeUndefined();
    expect(body.warning).toBeUndefined();
    delete process.env.GIT_COMMIT;
  });
});
