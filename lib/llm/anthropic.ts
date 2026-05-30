import type { LlmCall, LlmResponse } from "./types";

export async function callAnthropic(req: LlmCall): Promise<LlmResponse> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const system = req.messages.find((m) => m.role === "system")?.content;
  const messages = req.messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature,
      system,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as any;
  const text = (json.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  return {
    text,
    usage: json.usage
      ? { promptTokens: json.usage.input_tokens, completionTokens: json.usage.output_tokens }
      : undefined,
  };
}
