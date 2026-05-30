// @vitest-environment node
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { callAnthropic } from "./anthropic";

const server = setupServer(
  http.post("https://api.anthropic.com/v1/messages", () =>
    HttpResponse.json({
      content: [{ type: "text", text: "hi back" }],
      usage: { input_tokens: 5, output_tokens: 2 },
    }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("callAnthropic", () => {
  it("returns text and token usage", async () => {
    process.env.ANTHROPIC_API_KEY = "ant-test";
    const r = await callAnthropic({
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(r.text).toBe("hi back");
    expect(r.usage).toEqual({ promptTokens: 5, completionTokens: 2 });
  });
});
