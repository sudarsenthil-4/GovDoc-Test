import { describe, it, expect } from "vitest";
import { USE_CASE_TONE, USE_CASE_FAMILY } from "./use-case-tone";

describe("use-case-tone registry", () => {
  it("maps the three review use cases to distinct tone keys", () => {
    expect(USE_CASE_TONE["cmgc-pde"]).toBe("indigo");
    expect(USE_CASE_TONE["cucp-reevals"]).toBe("blue");
    expect(USE_CASE_TONE["row-appraisal"]).toBe("green");
  });

  it("provides a friendly family label per use case", () => {
    expect(USE_CASE_FAMILY["cmgc-pde"]).toMatch(/Procurement/i);
    expect(USE_CASE_FAMILY["cucp-reevals"]).toMatch(/Certification/i);
    expect(USE_CASE_FAMILY["row-appraisal"]).toMatch(/Real Property/i);
  });
});
