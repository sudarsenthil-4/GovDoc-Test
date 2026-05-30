import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  let writes: string[];
  let originalWrite: typeof process.stdout.write;

  beforeEach(() => {
    writes = [];
    originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array) => {
      writes.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
      return true;
    }) as typeof process.stdout.write;
    vi.resetModules();
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
  });

  it("emits JSON to stdout with base service field", async () => {
    const { logger } = await import("./logger");
    logger.info({ runId: "r1" }, "hello");
    const line = writes.find((w) => w.includes('"msg":"hello"'));
    expect(line).toBeDefined();
    const parsed = JSON.parse(line!);
    expect(parsed.service).toBe("govdoc");
    expect(parsed.runId).toBe("r1");
    expect(parsed.msg).toBe("hello");
    expect(parsed.level).toBe(30);
  });

  it("respects LOG_LEVEL env", async () => {
    process.env.LOG_LEVEL = "warn";
    const { logger } = await import("./logger");
    logger.info("noisy");
    logger.warn("important");
    expect(writes.some((w) => w.includes('"msg":"noisy"'))).toBe(false);
    expect(writes.some((w) => w.includes('"msg":"important"'))).toBe(true);
    delete process.env.LOG_LEVEL;
  });
});
