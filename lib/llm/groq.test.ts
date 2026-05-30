// @vitest-environment node
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { callGroq } from "./groq";

const server = setupServer(
  http.post("https://api.groq.com/openai/v1/chat/completions", () =>
    HttpResponse.json({
      choices: [{ message: { content: "fast hi" } }],
      usage: { prompt_tokens: 4, completion_tokens: 2 },
    }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("callGroq", () => {
  it("returns text and token usage", async () => {
    process.env.GROQ_API_KEY = "gk-test";
    const r = await callGroq({
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(r.text).toBe("fast hi");
    expect(r.usage).toEqual({ promptTokens: 4, completionTokens: 2 });
  });
});
