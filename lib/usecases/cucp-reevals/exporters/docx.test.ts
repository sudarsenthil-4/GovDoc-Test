import { describe, it, expect } from "vitest";
import { docxExporter } from "./docx";
import type { Level1Data, Level2Data, Level3Data, Criterion } from "@/lib/usecases/cucp-reevals/types";

const seven = (): Criterion[] =>
  Array.from({ length: 7 }, (_, i) => ({
    s_no: i + 1,
    category: `Cat ${i + 1}`,
    qualification: `Q ${i + 1}`,
    rule_requires: "rule",
    evidence_summary: "ev",
    reasoning: "r",
    pass_fail: "Pass" as const,
    request_info: "No" as const,
    confidence: 9.5,
  }));

const sample = {
  level1: {
    firm_name: "Acme DBE",
    cross_reference_result: "PASSED",
    narrative_pnw: "NOT PROVIDED",
    extracted_facts: [
      {
        id: "fact_1",
        when: "2025",
        where: "CA",
        who: "Owner",
        what: "lost contract",
        why: "discrim",
        magnitude: "$50k",
        demographic_flag: true,
        source_quote: "quoted text",
      },
    ],
  } as Level1Data,
  level2: { classifications: [] } as Level2Data,
  level3: { criteria: seven(), final_decision: "Yes" as const, certifier_comments: "Looks good." } as Level3Data,
  report: { markdown_report: "", evaluation_date: "2025-05-05T00:00:00.000Z", analyst_overrides: [] },
  overrides: [],
};

describe("docxExporter (CUCP)", () => {
  it("produces a non-empty buffer", async () => {
    const bytes = await docxExporter.build(sample);
    expect(bytes.byteLength).toBeGreaterThan(100);
  });

  it("output starts with ZIP magic bytes (DOCX = ZIP)", async () => {
    const bytes = await docxExporter.build(sample);
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it("exposes the canonical Exporter contract fields", () => {
    expect(docxExporter.id).toBe("docx");
    expect(docxExporter.contentType).toContain("wordprocessingml");
  });
});
