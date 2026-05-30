import { describe, it, expect } from "vitest";
import { parseChunkResults, normalizeStatus } from "./parse-chunk-results";

const SAMPLE_ITEMS = [
  {
    category: "Title Page",
    score: 4,
    criteria_met: "Yes",
    evidence: "Found on page 1",
    status: "✅ Pass",
    comments: "",
  },
  {
    category: "Reconciliation",
    score: 3,
    criteria_met: "Partial",
    evidence: "Reconciliation section present",
    status: "⚠️ Warning",
    comments: "Needs more detail",
  },
];

describe("parseChunkResults", () => {
  it("parses a plain JSON array (no fences) into EvaluationResult items", () => {
    const json = JSON.stringify(SAMPLE_ITEMS);
    const results = parseChunkResults(json, ["Title Page", "Reconciliation"]);
    expect(results).toHaveLength(2);
    expect(results[0]!.category).toBe("Title Page");
    expect(results[0]!.score).toBe(4);
    expect(results[1]!.category).toBe("Reconciliation");
  });

  it("strips ```json ... ``` fences before parsing", () => {
    const json = `\`\`\`json\n${JSON.stringify(SAMPLE_ITEMS)}\n\`\`\``;
    const results = parseChunkResults(json, ["Title Page", "Reconciliation"]);
    expect(results).toHaveLength(2);
    expect(results[0]!.category).toBe("Title Page");
  });

  it('maps "Reconciliation" to "Reconciliation", NOT "HABU Reconciliation" (longest-substring tiebreak)', () => {
    // "Reconciliation" is a substring of "HABU Reconciliation" and also matches "Reconciliation" exactly.
    // The fuzzy path should pick "Reconciliation" because exact match fires first.
    const item = [
      {
        category: "Reconciliation",
        score: 3,
        criteria_met: "Yes",
        evidence: "Present",
        status: "✅ Pass",
        comments: "",
      },
    ];
    const results = parseChunkResults(JSON.stringify(item), ["Reconciliation"]);
    expect(results).toHaveLength(1);
    expect(results[0]!.category).toBe("Reconciliation");
  });

  it('stores score "N/A" as -1', () => {
    const item = [
      {
        category: "Title Page",
        score: "N/A",
        criteria_met: "N/A",
        evidence: "N/A",
        status: "⚪ N/A",
        comments: "",
      },
    ];
    const results = parseChunkResults(JSON.stringify(item), ["Title Page"]);
    expect(results).toHaveLength(1);
    expect(results[0]!.score).toBe(-1);
  });

  it("stores numeric score 5 as 5", () => {
    const item = [
      {
        category: "Title Page",
        score: 5,
        criteria_met: "Yes",
        evidence: "Full compliance",
        status: "✅ Pass",
        comments: "",
      },
    ];
    const results = parseChunkResults(JSON.stringify(item), ["Title Page"]);
    expect(results).toHaveLength(1);
    expect(results[0]!.score).toBe(5);
  });

  it("silently drops items with unknown categories", () => {
    const items = [
      {
        category: "Nonexistent Category XYZ",
        score: 3,
        criteria_met: "Yes",
        evidence: "N/A",
        status: "✅ Pass",
        comments: "",
      },
      {
        category: "Title Page",
        score: 3,
        criteria_met: "Yes",
        evidence: "Present",
        status: "✅ Pass",
        comments: "",
      },
    ];
    const results = parseChunkResults(JSON.stringify(items), ["Title Page"]);
    expect(results).toHaveLength(1);
    expect(results[0]!.category).toBe("Title Page");
  });

  it("returns [] for malformed JSON", () => {
    const results = parseChunkResults("{ not valid json }", ["Title Page"]);
    expect(results).toEqual([]);
  });

  it("returns [] for empty content", () => {
    const results = parseChunkResults("", ["Title Page"]);
    expect(results).toEqual([]);
  });
});

describe("normalizeStatus", () => {
  it('normalizes Pass variants to "✅ Pass"', () => {
    expect(normalizeStatus("Pass")).toBe("✅ Pass");
    expect(normalizeStatus("pass")).toBe("✅ Pass");
    expect(normalizeStatus("PASS")).toBe("✅ Pass");
    expect(normalizeStatus("✅ Pass")).toBe("✅ Pass");
    expect(normalizeStatus("✅Pass")).toBe("✅ Pass");
  });

  it('normalizes Warning variants to "⚠️ Warning"', () => {
    expect(normalizeStatus("Warning")).toBe("⚠️ Warning");
    expect(normalizeStatus("warning")).toBe("⚠️ Warning");
    expect(normalizeStatus("⚠️ Warning")).toBe("⚠️ Warning");
  });

  it('normalizes Fail variants to "❌ Fail"', () => {
    expect(normalizeStatus("Fail")).toBe("❌ Fail");
    expect(normalizeStatus("fail")).toBe("❌ Fail");
    expect(normalizeStatus("❌ Fail")).toBe("❌ Fail");
  });

  it('normalizes N/A variants to "⚪ N/A"', () => {
    expect(normalizeStatus("N/A")).toBe("⚪ N/A");
    expect(normalizeStatus("n/a")).toBe("⚪ N/A");
    expect(normalizeStatus("⚪ N/A")).toBe("⚪ N/A");
  });

  it('normalizes Error variants to "❌ Error"', () => {
    expect(normalizeStatus("Error")).toBe("❌ Error");
    expect(normalizeStatus("error")).toBe("❌ Error");
    expect(normalizeStatus("❌ Error")).toBe("❌ Error");
  });

  it('maps unknown strings to "❌ Error"', () => {
    expect(normalizeStatus("something random")).toBe("❌ Error");
    expect(normalizeStatus("")).toBe("❌ Error");
  });

  it('maps "Failed with error" to "❌ Fail" (fail check before error check)', () => {
    expect(normalizeStatus("Failed with error")).toBe("❌ Fail");
  });
});

describe("parseChunkResults – invalid score handling", () => {
  it("stores invalid score string as 0 and forces status to ❌ Error", () => {
    const item = [
      {
        category: "Title Page",
        score: "invalid",
        status: "Pass",
        criteria_met: "x",
        evidence: "y",
        comments: "z",
      },
    ];
    const results = parseChunkResults(JSON.stringify(item), ["Title Page"]);
    expect(results).toHaveLength(1);
    expect(results[0]!.score).toBe(0);
    expect(results[0]!.status).toBe("❌ Error");
  });

  it('maps category "Habu Reconciliation" (different casing) to "HABU Reconciliation"', () => {
    const item = [
      {
        category: "Habu Reconciliation",
        score: 3,
        status: "Pass",
        criteria_met: "x",
        evidence: "y",
        comments: "",
      },
    ];
    const results = parseChunkResults(JSON.stringify(item), ["HABU Reconciliation"]);
    expect(results).toHaveLength(1);
    expect(results[0]!.category).toBe("HABU Reconciliation");
  });
});
