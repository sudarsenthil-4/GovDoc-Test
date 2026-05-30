import { describe, it, expect } from "vitest";
import { buildLevel2SystemPrompt, buildLevel2UserMessage } from "./level-2-classify";
import type { ExtractedFact } from "@/lib/usecases/cucp-reevals/types";
import type { Precedent } from "@/lib/usecases/cucp-reevals/memory/precedents";

describe("buildLevel2SystemPrompt", () => {
  it("contains all 5 category labels", () => {
    const p = buildLevel2SystemPrompt();
    expect(p).toContain("Social Disadvantage");
    expect(p).toContain("Economic Disadvantage");
    expect(p).toContain("Institutional/Systemic Barrier");
    expect(p).toContain("Ordinary Business Risk");
    expect(p).toContain("Insufficient Evidence");
  });

  it("contains the §26.67 anchor and OUTPUT FORMAT header", () => {
    const p = buildLevel2SystemPrompt();
    expect(p).toContain("49 CFR §26.67");
    expect(p).toContain("OUTPUT FORMAT");
  });

  it("includes the institutional memory block when precedents are provided", () => {
    const precedents: Precedent[] = [
      { target: "Lost a contract due to pricing", correction: "Ordinary Business Risk", human_reasoning: "no demo factor" },
    ];
    const prompt = buildLevel2SystemPrompt(precedents);
    expect(prompt).toContain("INSTITUTIONAL MEMORY - LEVEL 2 HUMAN CORRECTIONS:");
    expect(prompt).toContain("'Lost a contract due to pricing' -> Classify as: 'Ordinary Business Risk'");
  });

  it("omits the block when precedents is empty", () => {
    const prompt = buildLevel2SystemPrompt();
    expect(prompt).not.toContain("INSTITUTIONAL MEMORY");
  });
});

describe("buildLevel2UserMessage", () => {
  it("contains Financial Context header and Extracted Facts to classify header", () => {
    const msg = buildLevel2UserMessage([], "Some financials");
    expect(msg).toContain("Financial Context:");
    expect(msg).toContain("Extracted Facts to classify:");
  });

  it("includes JSON-stringified facts", () => {
    const facts: ExtractedFact[] = [
      {
        id: "fact_1",
        when: "2023-01-01",
        where: "New York",
        who: "John Doe",
        what: "Denied loan",
        why: "discrimination",
        magnitude: "$50000",
        demographic_flag: true,
        source_quote: "I was denied",
      },
    ];
    const msg = buildLevel2UserMessage(facts, "financials");
    expect(msg).toContain("fact_1");
    expect(msg).toContain("Denied loan");
  });
});
