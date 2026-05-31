import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("instrumentation.register", () => {
  const originalEnv = { ...process.env };
  const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`);
  }) as never);
  const errSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

  beforeEach(() => {
    vi.resetModules();
    for (const k of Object.keys(process.env)) delete process.env[k];
  });

  afterEach(() => {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, originalEnv);
    exitSpy.mockClear();
    errSpy.mockClear();
  });

  it("returns when all required vars are present", async () => {
    process.env.OPENAI_API_KEY = "x";
    process.env.ANTHROPIC_API_KEY = "x";
    process.env.GROQ_API_KEY = "x";
    process.env.GOVDOC_SESSION_SECRET = "a".repeat(32);
    process.env.NEXT_RUNTIME = "nodejs";
    const { register } = await import("./instrumentation");
    await register();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("calls process.exit(1) and logs to stderr when env is invalid", async () => {
    process.env.NEXT_RUNTIME = "nodejs";
    const { register } = await import("./instrumentation");
    await expect(register()).rejects.toThrow(/process.exit/);
    expect(exitSpy).toHaveBeenCalledWith(1);
    const written = errSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(written).toContain("OPENAI_API_KEY");
  });

  it("skips validation when NEXT_RUNTIME is not nodejs (edge runtime)", async () => {
    process.env.NEXT_RUNTIME = "edge";
    const { register } = await import("./instrumentation");
    await register();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
