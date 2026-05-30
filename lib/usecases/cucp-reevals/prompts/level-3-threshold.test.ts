import { describe, it, expect } from "vitest";
import { buildLevel3SystemPrompt, buildLevel3UserMessage } from "./level-3-threshold";
import type { Classification, ExtractedFact } from "@/lib/usecases/cucp-reevals/types";
import type { Precedent } from "@/lib/usecases/cucp-reevals/memory/precedents";

describe("buildLevel3SystemPrompt", () => {
  it("contains all 7 criteria labels", () => {
    const p = buildLevel3SystemPrompt();
    expect(p).toContain("Meets Requirements of SED (No Race or Sex Presumptions)");
    expect(p).toContain("Meets Personal Net Worth (PNW < $2.047M)");
    expect(p).toContain("Meets Disadvantage in American Society");
    expect(p).toContain("Demonstration of Disadvantage (Past Experiences)");
    expect(p).toContain("Evidence of Specific Impediments");
    expect(p).toContain("Link Between Impediments and Harm");
    expect(p).toContain("Economic Disadvantage in Fact");
  });

  it("contains Preponderance of the Evidence and §26.67", () => {
    const p = buildLevel3SystemPrompt();
    expect(p).toContain("Preponderance of the Evidence");
    expect(p).toContain("49 CFR §26.67");
  });

  it("includes the institutional memory block when precedents are provided", () => {
    const precedents: Precedent[] = [
      { target: "Past Experiences", correction: "Fail", human_reasoning: "lacks dates", s_no: 4 },
    ];
    const p = buildLevel3SystemPrompt(precedents);
    expect(p).toContain("INSTITUTIONAL MEMORY - LEVEL 3 HUMAN CORRECTIONS:");
    expect(p).toContain("Correction for 'Past Experiences': Fail");
  });

  it("omits the institutional memory block when precedents is empty", () => {
    const p = buildLevel3SystemPrompt();
    expect(p).not.toContain("INSTITUTIONAL MEMORY");
  });
});

describe("buildLevel3UserMessage", () => {
  it("contains Classified Evidence, Raw Facts, and PNW Data point headers", () => {
    const msg = buildLevel3UserMessage([], [], "PNW Value");
    expect(msg).toContain("Classified Evidence:");
    expect(msg).toContain("Raw Facts:");
    expect(msg).toContain("PNW Data point:");
  });

  it("includes JSON-stringified classifications and facts", () => {
    const classifications: Classification[] = [
      {
        fact_id: "fact_1",
        classification: "Social Disadvantage",
        summary: "Test summary",
        reasoning: "Test reasoning",
      },
    ];
    const facts: ExtractedFact[] = [
      {
        id: "fact_1",
        when: "2023",
        where: "NY",
        who: "John",
        what: "Denied loan",
        why: "bias",
        magnitude: "$100k",
        demographic_flag: true,
        source_quote: "quote",
      },
    ];
    const msg = buildLevel3UserMessage(classifications, facts, "PNW < $2M");
    expect(msg).toContain("fact_1");
    expect(msg).toContain("Social Disadvantage");
    expect(msg).toContain("PNW < $2M");
  });
});
