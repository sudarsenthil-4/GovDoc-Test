import { describe, it, expect } from "vitest";
import { getExtractionRules } from "./extraction-rules";
import { VALID_CATEGORIES } from "../data/valid-categories";

describe("getExtractionRules", () => {
  it.each(VALID_CATEGORIES)("returns non-empty rules for category %s", (cat) => {
    const rules = getExtractionRules(cat);
    expect(rules).toBeTruthy();
    expect(rules.length).toBeGreaterThan(20);
  });

  it("returns the default fallback for unknown categories", () => {
    const rules = getExtractionRules("Unknown Category");
    expect(rules).toContain("PHYSICALLY LOCATE");
  });

  it("Title Page rules mention 'APPRAISAL TITLE PAGE'", () => {
    expect(getExtractionRules("Title Page")).toContain("APPRAISAL TITLE PAGE");
  });

  it("COS & HMDD rules mention HMDD and Certificate of Sufficiency", () => {
    const rules = getExtractionRules("COS & HMDD");
    expect(rules).toContain("HMDD");
    expect(rules).toContain("CERTIFICATE OF SUFFICIENCY");
  });

  it("Certificate of Appraiser rules mention anti-hallucination hard rule", () => {
    const rules = getExtractionRules("Certificate of Appraiser");
    expect(rules).toContain("ANTI-HALLUCINATION HARD RULE");
    expect(rules).toContain("CERTIFICATE OF APPRAISER");
  });

  it("Diary rules mention all three required documents", () => {
    const rules = getExtractionRules("Diary, Notice of Decision to Appraise & Loss of Business Goodwill");
    expect(rules).toContain("RW DIARY");
    expect(rules).toContain("NOTICE OF DECISION TO APPRAISE");
    expect(rules).toContain("Loss of Business Goodwill");
  });

  it("HABU Vacant rules mention most likely buyer hard gate", () => {
    const rules = getExtractionRules("HABU Vacant");
    expect(rules).toContain("most likely buyer");
    expect(rules).toContain("HARD GATE FOR SCORE 4 AND 5");
  });
});
