import type { LlmCall, LlmResponse } from "./types";

export async function callOpenAi(req: LlmCall): Promise<LlmResponse> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      temperature: req.temperature,
      max_tokens: req.maxTokens,
      response_format: req.responseFormat === "json_object" ? { type: "json_object" } : undefined,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as any;
  return {
    text: json.choices?.[0]?.message?.content ?? "",
    usage: json.usage
      ? { promptTokens: json.usage.prompt_tokens, completionTokens: json.usage.completion_tokens }
      : undefined,
  };
}
