import { http, HttpResponse, passthrough } from "msw";
import { hashPrompt } from "@/tests/utils/hash-prompt";
import openaiSnaps from "@/tests/fixtures/llm-snapshots/openai.json";
import anthropicSnaps from "@/tests/fixtures/llm-snapshots/anthropic.json";
import groqSnaps from "@/tests/fixtures/llm-snapshots/groq.json";

const RECORD = process.env.RECORD_LLM === "1";

function snapHandler(url: string, snaps: Record<string, unknown>, getMessages: (body: any) => any[]) {
  return http.post(url, async ({ request }) => {
    const body = await request.json();
    const key = hashPrompt(getMessages(body));
    const snap = (snaps as Record<string, any>)[key];
    if (!snap) {
      if (RECORD) return passthrough();
      throw new Error(`No LLM snapshot for ${url}: ${key.slice(0, 16)}\nPrompt: ${JSON.stringify(getMessages(body)).slice(0, 200)}`);
    }
    return HttpResponse.json(snap);
  });
}

export const handlers = [
  snapHandler("https://api.openai.com/v1/chat/completions", openaiSnaps, (b) => b.messages ?? []),
  snapHandler("https://api.groq.com/openai/v1/chat/completions", groqSnaps, (b) => b.messages ?? []),
  snapHandler("https://api.anthropic.com/v1/messages", anthropicSnaps, (b) => {
    const sys = b.system ? [{ role: "system", content: b.system }] : [];
    return [...sys, ...(b.messages ?? [])];
  }),
];
