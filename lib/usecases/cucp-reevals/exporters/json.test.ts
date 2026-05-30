import { describe, it, expect } from "vitest";
import { jsonExporter } from "./json";
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
    firm_name: "Acme",
    cross_reference_result: "PASSED",
    narrative_pnw: "$500,000",
    extracted_facts: [],
  } as Level1Data,
  level2: { classifications: [] } as Level2Data,
  level3: { criteria: seven(), final_decision: "Yes" as const, certifier_comments: "ok" } as Level3Data,
  report: { markdown_report: "# r", evaluation_date: "2025-05-05T00:00:00.000Z", analyst_overrides: [] },
  overrides: [],
};

describe("jsonExporter (CUCP)", () => {
  it("exposes the canonical Exporter contract fields", () => {
    expect(jsonExporter.id).toBe("json");
    expect(jsonExporter.contentType).toBe("application/json");
  });

  it("produces valid JSON containing all bundle keys", async () => {
    const bytes = await jsonExporter.build(sample);
    const text = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(text);
    expect(parsed.level1.firm_name).toBe("Acme");
    expect(parsed.level2.classifications).toEqual([]);
    expect(parsed.level3.criteria).toHaveLength(7);
    expect(parsed.report.markdown_report).toBe("# r");
    expect(parsed.overrides).toEqual([]);
  });

  it("is pretty-printed (contains newlines)", async () => {
    const bytes = await jsonExporter.build(sample);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("\n");
  });
});
