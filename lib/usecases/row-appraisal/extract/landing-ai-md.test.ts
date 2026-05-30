import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { extractTextFromLandingAiMd } from "./landing-ai-md";

describe("extractTextFromLandingAiMd", () => {
  it("joins two markdown tokens with double newline", () => {
    const input = `markdown="hello world" something markdown="second chunk"`;
    const result = extractTextFromLandingAiMd(input);
    expect(result).toBe("hello world\n\nsecond chunk");
  });

  it("decodes \\n and \\\" escape sequences", () => {
    const input = `markdown="line one\\nline two\\nhe said \\"hi\\""`;
    const result = extractTextFromLandingAiMd(input);
    expect(result).toBe(`line one\nline two\nhe said "hi"`);
  });

  it("strips <a id='...'></a> anchors", () => {
    const input = `markdown="<a id='section1'></a> Some text here"`;
    const result = extractTextFromLandingAiMd(input);
    expect(result).toBe("Some text here");
  });

  it("returns raw input unchanged when no markdown tokens present", () => {
    const input = "plain text with no markdown tokens at all";
    const result = extractTextFromLandingAiMd(input);
    expect(result).toBe(input);
  });

  it("handles real bundled landing_ai_output.md and returns > 100_000 chars", () => {
    const assetPath = resolve(
      process.cwd(),
      "lib/usecases/row-appraisal/assets/landing_ai_output.md"
    );
    const raw = readFileSync(assetPath, "utf8");
    const result = extractTextFromLandingAiMd(raw);
    expect(result.length).toBeGreaterThan(30_000);
  });
});
