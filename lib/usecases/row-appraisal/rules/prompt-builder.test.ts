import { describe, it, expect } from "vitest";
import {
  buildChunkSystemPrompt,
  buildChunkUserPrompt,
  type ChunkRubric,
} from "./prompt-builder";

describe("buildChunkSystemPrompt", () => {
  const sample: ChunkRubric = {
    "Title Page": {
      "Score 1": "missing",
      "Score 3": "partial",
      "Score 5": "complete",
    },
    "Certificate of Appraiser": {
      "Score 1": "", // empty rubric level
      "Score 5": "all signatures present",
    },
  };

  it("includes the core anti-hallucination rules block", () => {
    const p = buildChunkSystemPrompt(sample);
    expect(p).toContain("CORE ANTI-HALLUCINATION RULES");
  });

  it("includes the OUTPUT FORMAT section", () => {
    expect(buildChunkSystemPrompt(sample)).toContain("OUTPUT FORMAT");
  });

  it("includes the STATUS RULES section", () => {
    expect(buildChunkSystemPrompt(sample)).toContain("STATUS RULES");
  });

  it("emits per-category extraction rules from getExtractionRules", () => {
    const p = buildChunkSystemPrompt(sample);
    expect(p).toContain("## Title Page");
    expect(p).toContain("APPRAISAL TITLE PAGE"); // from Title Page extraction rules
  });

  it("renders empty rubric levels as the not-specified hint", () => {
    const p = buildChunkSystemPrompt(sample);
    expect(p).toContain(
      "(not specified in rubric - do NOT award this score)"
    );
  });

  it("includes the N/A logic block", () => {
    const p = buildChunkSystemPrompt(sample);
    expect(p).toContain('N/A" (not a numeric score)');
  });

  it("includes cross-category dependencies block", () => {
    const p = buildChunkSystemPrompt(sample);
    expect(p).toContain("CROSS-CATEGORY DEPENDENCIES");
  });

  it("includes rubric rules for both categories in the chunk", () => {
    const p = buildChunkSystemPrompt(sample);
    expect(p).toContain("## Title Page");
    expect(p).toContain("## Certificate of Appraiser");
  });

  it("renders non-empty rubric score descriptions", () => {
    const p = buildChunkSystemPrompt(sample);
    expect(p).toContain("missing");
    expect(p).toContain("all signatures present");
  });
});

describe("buildChunkUserPrompt", () => {
  it("contains each category as a bullet", () => {
    const p = buildChunkUserPrompt(["Title Page", "Certificate of Appraiser"]);
    expect(p).toContain("- Title Page");
    expect(p).toContain("- Certificate of Appraiser");
  });

  it("contains the count of categories", () => {
    const p = buildChunkUserPrompt(["Title Page", "RW 7-9", "Methodology"]);
    expect(p).toMatch(/3/); // count appears somewhere
  });

  it("contains instructions to output JSON array", () => {
    const p = buildChunkUserPrompt(["Title Page"]);
    expect(p).toContain("JSON array");
  });

  it("mentions cross-category dependency check step", () => {
    const p = buildChunkUserPrompt(["Title Page"]);
    expect(p).toContain("cross-category");
  });
});
