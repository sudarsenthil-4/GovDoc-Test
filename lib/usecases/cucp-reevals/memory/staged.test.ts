import { describe, it, expect } from "vitest";
import { l1OverrideToPrecedent, l2OverrideToPrecedent, l3OverrideToPrecedent } from "./staged";
import type { Classification, Criterion } from "@/lib/usecases/cucp-reevals/types";

describe("l2OverrideToPrecedent", () => {
  const classifications: Classification[] = [
    {
      fact_id: "fact_1",
      classification: "Ordinary Business Risk",
      summary: "Lost a contract due to pricing.",
      reasoning: "No demographic factor cited.",
    },
  ];

  it("maps the override to a Precedent using the AI's prior classification as target", () => {
    const p = l2OverrideToPrecedent(
      { fact_id: "fact_1", new_category: "Social Disadvantage", reason: "Affidavit cites bias." },
      classifications,
    );
    expect(p).toEqual({
      target: "Ordinary Business Risk",
      correction: "Social Disadvantage",
      human_reasoning: "Affidavit cites bias.",
      fact_id: "fact_1",
    });
  });

  it("falls back to the fact_id when the prior classification is missing", () => {
    const p = l2OverrideToPrecedent(
      { fact_id: "fact_404", new_category: "Insufficient Evidence", reason: "Need more docs." },
      classifications,
    );
    expect(p.target).toBe("fact_404");
  });

  it("resolves 'Keep Current (Fix Reasoning Only)' to the prior classification value", () => {
    const p = l2OverrideToPrecedent(
      {
        fact_id: "fact_1",
        new_category: "Keep Current (Fix Reasoning Only)",
        reason: "Reasoning text was misleading; category was right.",
      },
      classifications,
    );
    expect(p.correction).toBe("Ordinary Business Risk");
  });
});

describe("l3OverrideToPrecedent", () => {
  const criteria: Criterion[] = [
    {
      s_no: 4,
      category: "Demonstration of Disadvantage",
      qualification: "Past Experiences",
      rule_requires: "Specific incidents",
      evidence_summary: "Affidavit cites 3 denied bids.",
      reasoning: "Sufficient.",
      pass_fail: "Pass",
      request_info: "No",
      confidence: 0.9,
    },
  ];

  it("maps a Pass override to a Precedent with the qualification as target", () => {
    const p = l3OverrideToPrecedent(
      { s_no: "4", verdict: "Fail", request_info: "No", reason: "Affidavit lacks dates and amounts." },
      criteria,
    );
    expect(p).toEqual({
      target: "Past Experiences",
      correction: "Fail",
      human_reasoning: "Affidavit lacks dates and amounts.",
      s_no: 4,
    });
  });

  it("annotates correction with (request_info=Yes) when set", () => {
    const p = l3OverrideToPrecedent(
      { s_no: "4", verdict: "Fail", request_info: "Yes", reason: "Need updated tax records." },
      criteria,
    );
    expect(p.correction).toBe("Fail (request_info=Yes)");
  });

  it("falls back to s_no-based label when criterion is missing", () => {
    const p = l3OverrideToPrecedent(
      { s_no: "99", verdict: "Pass", request_info: "No", reason: "Out-of-range row referenced." },
      criteria,
    );
    expect(p.target).toBe("Criterion 99");
    expect(p.s_no).toBe(99);
  });
});

describe("l1OverrideToPrecedent", () => {
  it("converts a fact-field override into a precedent with formatted target", () => {
    const p = l1OverrideToPrecedent({
      kind: "fact-field",
      fact_id: "fact_3",
      field: "When",
      corrected_value: "2020",
      reason: "narrative explicitly says 2020",
    });
    expect(p.target).toBe("Fact fact_3: When");
    expect(p.correction).toBe("2020");
    expect(p.human_reasoning).toBe("narrative explicitly says 2020");
  });

  it("converts a specific-incident override into a precedent with the description as correction", () => {
    const p = l1OverrideToPrecedent({
      kind: "specific-incident",
      description: "Owner cited 2019 loan denial on page 4",
      reason: "missed by AI on first pass",
    });
    expect(p.target).toBe("Specific Incident Detail");
    expect(p.correction).toBe("Owner cited 2019 loan denial on page 4");
    expect(p.human_reasoning).toBe("missed by AI on first pass");
  });

  it("throws for firm-name kind (handled as field-override, not precedent)", () => {
    expect(() =>
      l1OverrideToPrecedent({
        kind: "firm-name",
        corrected_value: "Acme, LLC.",
        reason: "matches incorporation docs",
      }),
    ).toThrow(/firm-name/);
  });

  it("throws for narrative-pnw kind", () => {
    expect(() =>
      l1OverrideToPrecedent({
        kind: "narrative-pnw",
        corrected_value: "1.2M",
        reason: "page 2 of narrative",
      }),
    ).toThrow(/narrative-pnw/);
  });
});
