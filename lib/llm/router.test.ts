// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { makeLlmRouter } from "./router";

vi.mock("./openai", () => ({ callOpenAi: vi.fn().mockResolvedValue({ text: "o" }) }));
vi.mock("./anthropic", () => ({ callAnthropic: vi.fn().mockResolvedValue({ text: "a" }) }));
vi.mock("./groq", () => ({ callGroq: vi.fn().mockResolvedValue({ text: "g" }) }));

describe("makeLlmRouter", () => {
  it("dispatches to the right provider", async () => {
    const router = makeLlmRouter();
    expect((await router.call({ provider: "openai", model: "x", messages: [] })).text).toBe("o");
    expect((await router.call({ provider: "anthropic", model: "x", messages: [] })).text).toBe("a");
    expect((await router.call({ provider: "groq", model: "x", messages: [] })).text).toBe("g");
  });
});
