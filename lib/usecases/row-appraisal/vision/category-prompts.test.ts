import { describe, it, expect } from "vitest";
import { getVisionPromptForCategory } from "./category-prompts";

describe("getVisionPromptForCategory", () => {
  it.each([
    ["Subject Assessor Map", [1, 12]],
    ["Subject Photos", [4, 12]],
    ["Comparable Map Sheet", [25, 35]],
    ["Appraisal Maps", [30, 50]],
  ] as const)("returns prompt + page range for %s", (cat, expectedRange) => {
    const result = getVisionPromptForCategory(cat);
    expect(result).not.toBeNull();
    expect(result!.pageRange).toEqual(expectedRange);
    expect(result!.prompt.length).toBeGreaterThan(200);
  });

  it("preserves caltrans key phrases verbatim in Subject Assessor Map prompt", () => {
    const r = getVisionPromptForCategory("Subject Assessor Map")!;
    expect(r.prompt).toContain("County Tax Assessor's office");
    expect(r.prompt).toContain('Score 4: Subject outlined in RED but NO caption');
  });

  it("preserves caltrans key phrases verbatim in Subject Photos prompt", () => {
    const r = getVisionPromptForCategory("Subject Photos")!;
    expect(r.prompt).toContain("'utility easement' line ≠ RW line");
  });

  it("preserves caltrans key phrases verbatim in Comparable Map Sheet prompt", () => {
    const r = getVisionPromptForCategory("Comparable Map Sheet")!;
    expect(r.prompt).toContain("subject outlined in RED, sales in ORANGE, listings in GREEN");
  });

  it("preserves caltrans key phrases verbatim in Appraisal Maps prompt", () => {
    const r = getVisionPromptForCategory("Appraisal Maps")!;
    expect(r.prompt).toContain("R/W APPRAISAL MAP");
  });

  it("returns null for unknown category", () => {
    expect(getVisionPromptForCategory("Bogus")).toBeNull();
  });
});
