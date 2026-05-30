import { describe, it, expect } from "vitest";
import { buildPrecedentsBlock, EMPTY_PRECEDENTS } from "./precedents";
import type { Precedent } from "./precedents";

describe("buildPrecedentsBlock", () => {
  it("returns empty string when precedents is empty", () => {
    expect(buildPrecedentsBlock(1, [])).toBe("");
    expect(buildPrecedentsBlock(2, [])).toBe("");
    expect(buildPrecedentsBlock(3, [])).toBe("");
  });

  it("renders the L1 block with caltrans wording", () => {
    const ps: Precedent[] = [
      { target: "Narrative PNW", correction: "1500000", human_reasoning: "round to nearest dollar" },
    ];
    const out = buildPrecedentsBlock(1, ps);
    expect(out).toContain("INSTITUTIONAL MEMORY - LEVEL 1 HUMAN CORRECTIONS:");
    expect(out).toContain("If you see 'Narrative PNW', apply correction: '1500000'");
    expect(out).toContain("Reason: round to nearest dollar");
  });

  it("renders the L2 block with caltrans wording", () => {
    const ps: Precedent[] = [
      { target: "Lost contract", correction: "Ordinary Business Risk", human_reasoning: "pricing competition", fact_id: "f1" },
    ];
    const out = buildPrecedentsBlock(2, ps);
    expect(out).toContain("INSTITUTIONAL MEMORY - LEVEL 2 HUMAN CORRECTIONS:");
    expect(out).toContain("Scenario: 'Lost contract' -> Classify as: 'Ordinary Business Risk'");
  });

  it("renders the L3 block with caltrans wording", () => {
    const ps: Precedent[] = [
      { target: "Past Experiences", correction: "Fail", human_reasoning: "lacks dates", s_no: 4 },
    ];
    const out = buildPrecedentsBlock(3, ps);
    expect(out).toContain("INSTITUTIONAL MEMORY - LEVEL 3 HUMAN CORRECTIONS:");
    expect(out).toContain("Correction for 'Past Experiences': Fail");
  });

  it("EMPTY_PRECEDENTS exports a usable shape", () => {
    expect(EMPTY_PRECEDENTS.level_1_precedents).toEqual([]);
    expect(EMPTY_PRECEDENTS.level_2_precedents).toEqual([]);
    expect(EMPTY_PRECEDENTS.level_3_precedents).toEqual([]);
  });
});
