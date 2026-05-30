export type LlmProvider = "openai" | "anthropic" | "groq";

export type LlmTextPart = { type: "text"; text: string };
// OpenAI Chat Completions wire format. Anthropic/Groq use different shapes — only forward image parts to the openai provider.
export type LlmImagePart = {
  type: "image_url";
  image_url: { url: string; detail?: "low" | "high" | "auto" };
};
export type LlmContent = string | Array<LlmTextPart | LlmImagePart>;

export type LlmCall = {
  provider: LlmProvider;
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: LlmContent }[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
};

export type LlmResponse = {
  text: string;
  usage?: { promptTokens: number; completionTokens: number };
};

export type LlmRouter = {
  call: (req: LlmCall) => Promise<LlmResponse>;
};
