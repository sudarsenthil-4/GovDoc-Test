import { createHash } from "node:crypto";

type Msg = { role: string; content: string };

export function hashPrompt(messages: Msg[]): string {
  const normalized = messages.map((m) => `${m.role}:${m.content.replace(/\s+/g, " ").trim()}`).join("|");
  return createHash("sha256").update(normalized).digest("hex");
}
