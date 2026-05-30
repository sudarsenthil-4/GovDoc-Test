// @vitest-environment node
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { callOpenAi } from "./openai";

const server = setupServer(
  http.post("https://api.openai.com/v1/chat/completions", () =>
    HttpResponse.json({
      choices: [{ message: { content: "hello" } }],
      usage: { prompt_tokens: 5, completion_tokens: 1 },
    }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("callOpenAi", () => {
  it("returns text and token usage", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const r = await callOpenAi({
      provider: "openai",
      model: "gpt-4o",
      messages: [{ role: "user", content: "hi" }],
    });
    expect(r.text).toBe("hello");
    expect(r.usage).toEqual({ promptTokens: 5, completionTokens: 1 });
  });

  it("passes multimodal content arrays through to the OpenAI client", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    let capturedBody: any;
    server.use(
      http.post("https://api.openai.com/v1/chat/completions", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ choices: [{ message: { content: "ok" } }] });
      }),
    );
    await callOpenAi({
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Look at this:" },
            { type: "image_url", image_url: { url: "data:image/png;base64,AAAA", detail: "high" } },
          ],
        },
      ],
    });
    expect(capturedBody.messages[0].content).toEqual([
      { type: "text", text: "Look at this:" },
      { type: "image_url", image_url: { url: "data:image/png;base64,AAAA", detail: "high" } },
    ]);
  });
});
