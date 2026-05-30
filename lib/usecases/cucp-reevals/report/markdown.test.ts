import { describe, it, expect } from "vitest";
import { applyOverridesToLevel3, generateFinalMarkdownReport } from "./markdown";
import type { Level1Data, Level2Data, Level3Data, AnalystOverride, Criterion } from "@/lib/usecases/cucp-reevals/types";

const seven = (overrides: Partial<Criterion>[] = []): Criterion[] =>
  Array.from({ length: 7 }, (_, i) => ({
    s_no: i + 1,
    category: `Cat ${i + 1}`,
    qualification: `Qual ${i + 1}`,
    rule_requires: "rule",
    evidence_summary: "evidence",
    reasoning: "reasoning",
    pass_fail: "Pass" as const,
    request_info: "No" as const,
    confidence: 9.5,
    ...overrides[i],
  }));

const baseL1: Level1Data = {
  firm_name: "Test Firm",
  cross_reference_result: "FAILED",
  narrative_pnw: "NOT PROVIDED",
  extracted_facts: [{
    id: "fact_1", when: "2025", where: "California", who: "Owner",
    what: "lost a contract", why: "discrimination", magnitude: "$50,000",
    demographic_flag: true, source_quote: "I lost the deal because…",
  }],
};
const baseL2: Level2Data = { classifications: [
  { fact_id: "fact_1", classification: "Social Disadvantage", summary: "summary text", reasoning: "rsn" },
] };
const baseL3: Level3Data = {
  criteria: seven(),
  final_decision: "Yes",
  certifier_comments: "All criteria met.",
};

describe("applyOverridesToLevel3", () => {
  it("returns the original level3 unchanged when overrides is empty", () => {
    const out = applyOverridesToLevel3(baseL3, []);
    expect(out.criteria).toHaveLength(7);
    expect(out.criteria.every((c) => c.pass_fail === "Pass")).toBe(true);
  });

  it("flips pass_fail on the targeted criterion", () => {
    const ovs: AnalystOverride[] = [{ s_no: 3, field: "pass_fail", value: "Fail", reasoning: "missing evidence" }];
    const out = applyOverridesToLevel3(baseL3, ovs);
    expect(out.criteria.find((c) => c.s_no === 3)?.pass_fail).toBe("Fail");
    expect(out.criteria.find((c) => c.s_no === 1)?.pass_fail).toBe("Pass");
  });

  it("flips request_info and reasoning fields", () => {
    const ovs: AnalystOverride[] = [
      { s_no: 5, field: "request_info", value: "Yes", reasoning: "need more docs" },
      { s_no: 7, field: "reasoning", value: "Replaced rationale text", reasoning: "clarify" },
    ];
    const out = applyOverridesToLevel3(baseL3, ovs);
    expect(out.criteria.find((c) => c.s_no === 5)?.request_info).toBe("Yes");
    expect(out.criteria.find((c) => c.s_no === 7)?.reasoning).toBe("Replaced rationale text");
  });

  it("ignores overrides whose s_no is not in the criteria list", () => {
    const ovs: AnalystOverride[] = [{ s_no: 99, field: "pass_fail", value: "Fail", reasoning: "x" }];
    const out = applyOverridesToLevel3(baseL3, ovs);
    expect(out.criteria.every((c) => c.pass_fail === "Pass")).toBe(true);
  });

  it("returns criteria sorted by s_no", () => {
    const out = applyOverridesToLevel3(baseL3, []);
    const nos = out.criteria.map((c) => c.s_no);
    expect(nos).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("generateFinalMarkdownReport", () => {
  it("contains the canonical headers", () => {
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, [], "2026-05-05T00:00:00.000Z");
    expect(md).toContain("CUCP EVALUATION REPORT");
    expect(md).toContain("PRE-SCORING AUDIT");
    expect(md).toContain("PART 1");
    expect(md).toContain("PART 2");
    expect(md).toContain("CERTIFIER COMMENTS");
    expect(md).toContain("CLASSIFICATION SUMMARY");
  });

  it("renders all six W5 fields for each fact", () => {
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, [], "2026-05-05T00:00:00.000Z");
    expect(md).toContain("**When:** 2025");
    expect(md).toContain("**Where:** California");
    expect(md).toContain("**Who:** Owner");
    expect(md).toContain("**What:**");
    expect(md).toContain("**Why:** discrimination");
    expect(md).toContain("**How/Magnitude:** $50,000");
  });

  it("formats the date in en-US locale", () => {
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, [], "2026-05-05T00:00:00.000Z");
    expect(md).toMatch(/Evaluation Date:\*\*\s+May\s+(4|5),\s+2026/);
  });

  it("flips Part-1 row 3 when an override changes pass_fail to Fail", () => {
    const ovs: AnalystOverride[] = [{ s_no: 3, field: "pass_fail", value: "Fail", reasoning: "x" }];
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, ovs, "2026-05-05T00:00:00.000Z");
    const part1 = md.split("PART 1")[1]?.split("PART 2")[0] ?? "";
    const lines = part1.split("\n").filter((l) => l.startsWith("| 3 "));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain("| No |");
    expect(lines[0]).toContain("| Yes |");
  });

  it("final-decision row reflects overall failure when any criterion fails", () => {
    const ovs: AnalystOverride[] = [{ s_no: 3, field: "pass_fail", value: "Fail", reasoning: "x" }];
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, ovs, "2026-05-05T00:00:00.000Z");
    const part1 = md.split("PART 1")[1]?.split("PART 2")[0] ?? "";
    const finalRow = part1.split("\n").find((l) => l.startsWith("| 8 "));
    expect(finalRow).toBeDefined();
    expect(finalRow!).toContain("| No |");
    expect(finalRow!).toContain("| Yes |");
  });

  it("does NOT contain backslash-dollar literal escapes (Streamlit workaround removed)", () => {
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, [], "2026-05-05T00:00:00.000Z");
    expect(md).not.toContain("\\$");
  });

  it("renders 'NONE' if there are no extracted facts", () => {
    const emptyL1 = { ...baseL1, extracted_facts: [] };
    const md = generateFinalMarkdownReport(emptyL1, baseL2, baseL3, [], "2026-05-05T00:00:00.000Z");
    const audit = md.split("PRE-SCORING AUDIT")[1]?.split("---")[0] ?? "";
    expect(audit).toContain("NONE");
  });

  it("defaults evaluationDateIso to current date when not provided", () => {
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3);
    expect(md).toContain("Evaluation Date:");
  });

  it("injects ANALYST OVERRIDES block when overrides are present, between PRE-SCORING AUDIT and CLASSIFICATION SUMMARY", () => {
    const ovs: AnalystOverride[] = [
      { s_no: 1, field: "pass_fail", value: "Fail", reasoning: "missing evidence" },
      { s_no: 4, field: "request_info", value: "Yes", reasoning: "need more docs" },
    ];
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, ovs, "2026-05-05T00:00:00.000Z");
    expect(md).toContain("ANALYST OVERRIDES");
    expect(md).toContain("**pass_fail:** Fail *(Justification: missing evidence)*");
    expect(md).toContain("**request_info:** Yes *(Justification: need more docs)*");
    // Position check: ANALYST OVERRIDES must appear before CLASSIFICATION SUMMARY
    const overridesIdx = md.indexOf("ANALYST OVERRIDES");
    const classIdx = md.indexOf("CLASSIFICATION SUMMARY");
    expect(overridesIdx).toBeGreaterThan(0);
    expect(overridesIdx).toBeLessThan(classIdx);
  });

  it("does NOT inject ANALYST OVERRIDES when overrides is empty", () => {
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, [], "2026-05-05T00:00:00.000Z");
    expect(md).not.toContain("ANALYST OVERRIDES");
  });

  it("renders L1 field overrides, L2 precedents, and L3 precedents from sessionOverrides", () => {
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, [], "2026-05-05T00:00:00.000Z", {
      l1FieldOverrides: { firm_name: { value: "Acme LLC", reason: "added LLC suffix" } },
      l2Precedents: [
        { target: "Social Disadvantage", correction: "Economic Disadvantage", human_reasoning: "fits PNW pattern better", fact_id: "fact_1" },
      ],
      l3Precedents: [
        { target: "PNW < $2.047M", correction: "Fail", human_reasoning: "applicant exceeds PNW threshold", s_no: 2 },
      ],
    });
    expect(md).toContain("ANALYST OVERRIDES");
    expect(md).toContain("Level 1 — Facts");
    expect(md).toContain("Firm name");
    expect(md).toContain("`Acme LLC`");
    expect(md).toContain("added LLC suffix");
    expect(md).toContain("Level 2 — Classifications");
    expect(md).toContain("fact_1");
    expect(md).toContain("`Social Disadvantage`");
    expect(md).toContain("`Economic Disadvantage`");
    expect(md).toContain("fits PNW pattern better");
    expect(md).toContain("Level 3 — Criteria");
    expect(md).toContain("#2 PNW < $2.047M");
    expect(md).toContain("`Fail`");
    expect(md).toContain("applicant exceeds PNW threshold");
  });

  it("renders sessionOverrides even when analystOverrides is empty", () => {
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, [], "2026-05-05T00:00:00.000Z", {
      l2Precedents: [{ target: "Social Disadvantage", correction: "Economic Disadvantage", human_reasoning: "rationale long enough here", fact_id: "fact_1" }],
    });
    expect(md).toContain("ANALYST OVERRIDES");
    expect(md).toContain("Level 2 — Classifications");
  });

  it("omits ANALYST OVERRIDES when sessionOverrides is empty and analystOverrides is empty", () => {
    const md = generateFinalMarkdownReport(baseL1, baseL2, baseL3, [], "2026-05-05T00:00:00.000Z", {
      l1FieldOverrides: {},
      l1Precedents: [],
      l2Precedents: [],
      l3Precedents: [],
    });
    expect(md).not.toContain("ANALYST OVERRIDES");
  });
});
