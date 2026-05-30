import { describe, it, expect } from "vitest";
import { DELIVERY_METHOD_KB_TEXT } from "./delivery-method-kb";

describe("delivery method KB", () => {
  it("contains all 5 method headers", () => {
    expect(DELIVERY_METHOD_KB_TEXT).toContain("Design Bid Build");
    expect(DELIVERY_METHOD_KB_TEXT).toContain("CMGC");
    expect(DELIVERY_METHOD_KB_TEXT).toContain("Design Build");
    expect(DELIVERY_METHOD_KB_TEXT).toContain("Progressive Design Build");
    expect(DELIVERY_METHOD_KB_TEXT).toContain("Job Order Contracting");
  });

  it("includes the comparison-of-primary-factors section", () => {
    expect(DELIVERY_METHOD_KB_TEXT).toContain("Comparison of Primary  Factors");
  });

  it("is at least 5000 chars (full table content present)", () => {
    expect(DELIVERY_METHOD_KB_TEXT.length).toBeGreaterThan(5000);
  });
});
