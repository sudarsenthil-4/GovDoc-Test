import type { LlmCall, LlmResponse, LlmRouter } from "./types";
import { callOpenAi } from "./openai";
import { callAnthropic } from "./anthropic";
import { callGroq } from "./groq";

export function makeLlmRouter(): LlmRouter {
  return {
    call(req: LlmCall): Promise<LlmResponse> {
      switch (req.provider) {
        case "openai": return callOpenAi(req);
        case "anthropic": return callAnthropic(req);
        case "groq": return callGroq(req);
      }
    },
  };
}
