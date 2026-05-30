import { describe, it, expect, vi } from "vitest";

// For the null-case test, we mock the pdf-mapping to point to a non-existent file.
// This avoids mocking ESM node:fs/promises which can't be spied on in jsdom env.
const { mappingMock } = vi.hoisted(() => ({
  mappingMock: {
    LANDING_AI_PDF_MAPPING: {} as Record<string, string>,
    DEFAULT_MARKDOWN_ASSET: "landing_ai_output.md",
  },
}));

vi.mock("../data/pdf-mapping", () => mappingMock);

import { loadBundledMarkdownForFilename } from "./load-bundled-md";

describe("loadBundledMarkdownForFilename", () => {
  it("known mapped filename returns correct asset name and non-empty text", async () => {
    mappingMock.LANDING_AI_PDF_MAPPING = {
      "Appraisal_EA2F590_Parcel_36668 (1).pdf": "landing_ai_output.md",
    };
    mappingMock.DEFAULT_MARKDOWN_ASSET = "landing_ai_output.md";
    const result = await loadBundledMarkdownForFilename(
      "Appraisal_EA2F590_Parcel_36668 (1).pdf"
    );
    expect(result).not.toBeNull();
    expect(result!.asset).toBe("landing_ai_output.md");
    expect(result!.text.length).toBeGreaterThan(30_000);
  });

  it("unknown filename falls back to landing_ai_output.md", async () => {
    mappingMock.LANDING_AI_PDF_MAPPING = {};
    mappingMock.DEFAULT_MARKDOWN_ASSET = "landing_ai_output.md";
    const result = await loadBundledMarkdownForFilename("random.pdf");
    expect(result).not.toBeNull();
    expect(result!.asset).toBe("landing_ai_output.md");
    expect(result!.text.length).toBeGreaterThan(30_000);
  });

  it("returns null when the asset file is missing", async () => {
    mappingMock.LANDING_AI_PDF_MAPPING = {};
    mappingMock.DEFAULT_MARKDOWN_ASSET = "__nonexistent_file__.md";
    const result = await loadBundledMarkdownForFilename("random.pdf");
    expect(result).toBeNull();
  });
});
