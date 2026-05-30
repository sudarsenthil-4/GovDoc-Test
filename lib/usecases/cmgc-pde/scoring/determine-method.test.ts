import { describe, it, expect } from "vitest";
import { determineMethod } from "./determine-method";

describe("determineMethod", () => {
  // Section scores baseline: all 2.0
  const baseSections = { A: 2.0, B: 2.0, C: 2.0, D: 2.0, E: 2.0, F: 2.0 };

  it("composite ≤ 1.40 → DBB / Design-Sequencing", () => {
    const r = determineMethod(1.30, baseSections, {});
    expect(r.recommended).toBe("Design-Bid-Build");
    expect(r.runnerUp).toBe("Design-Sequencing");
  });

  it("composite 1.40 < c ≤ 1.70 with c<1.55 → Design-Sequencing / DBB", () => {
    const r = determineMethod(1.50, baseSections, {});
    expect(r.recommended).toBe("Design-Sequencing");
    expect(r.runnerUp).toBe("Design-Bid-Build");
  });

  it("composite 1.55 ≤ c ≤ 1.70 → Design-Sequencing / CM/GC", () => {
    const r = determineMethod(1.65, baseSections, {});
    expect(r.recommended).toBe("Design-Sequencing");
    expect(r.runnerUp).toBe("CM/GC");
  });

  it("mid-range default (composite 1.85, all 2.0) → CM/GC / Design-Build/Best-Value (c_avg >= 2.0)", () => {
    // sections all 2.0 → c_avg = 2.0 (>= 2.0) → CM/GC, Design-Build/Best-Value
    const r = determineMethod(1.85, baseSections, {});
    expect(r.recommended).toBe("CM/GC");
    expect(r.runnerUp).toBe("Design-Build/Best-Value");
  });

  it("mid-range b_avg≥2.5 c_avg≥2.0 → Design-Build/Best-Value / CM/GC", () => {
    const r = determineMethod(1.95, { ...baseSections, B: 2.5, C: 2.0 }, {});
    expect(r.recommended).toBe("Design-Build/Best-Value");
    expect(r.runnerUp).toBe("CM/GC");
  });

  it("mid-range PDB trigger (a_avg≥2.5, A3=C, E3=C)", () => {
    const r = determineMethod(2.05, { ...baseSections, A: 2.5 }, { A3: "C", E3: "C" });
    expect(r.recommended).toBe("Progressive Design-Build");
    expect(r.runnerUp).toBe("CM/GC");
  });

  it("upper-range c_avg≥2.0 d_avg≥2.0 → Design-Build/Best-Value / PDB", () => {
    const r = determineMethod(2.30, { ...baseSections, C: 2.2, D: 2.2 }, {});
    expect(r.recommended).toBe("Design-Build/Best-Value");
    expect(r.runnerUp).toBe("Progressive Design-Build");
  });

  it("upper-range c_avg<1.5 → Design-Build/Low-Bid / CM/GC", () => {
    const r = determineMethod(2.30, { ...baseSections, C: 1.0 }, {});
    expect(r.recommended).toBe("Design-Build/Low-Bid");
    expect(r.runnerUp).toBe("CM/GC");
  });

  it("composite > 2.50 → PDB / CM/GC", () => {
    const r = determineMethod(2.80, baseSections, {});
    expect(r.recommended).toBe("Progressive Design-Build");
    expect(r.runnerUp).toBe("CM/GC");
  });

  it("borderline detection: composite within 0.15 of 1.40 → isBorderline true", () => {
    expect(determineMethod(1.42, baseSections, {}).isBorderline).toBe(true);
    expect(determineMethod(1.30, baseSections, {}).isBorderline).toBe(true);  // |1.30-1.40|=0.10
    expect(determineMethod(1.20, baseSections, {}).isBorderline).toBe(false); // |1.20-1.40|=0.20
  });
});
