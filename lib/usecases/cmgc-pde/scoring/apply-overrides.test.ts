import { describe, it, expect } from "vitest";
import { applyOverrides, computeOverrideStatus, OVERRIDE_RULES } from "./apply-overrides";

describe("applyOverrides", () => {
  it("R1 (A1=C): blocks DBB and Design-Sequencing", () => {
    const r = applyOverrides("Design-Bid-Build", "Design-Sequencing", { A1: "C" });
    expect(r.recommended).not.toBe("Design-Bid-Build");
    expect(r.recommended).not.toBe("Design-Sequencing");
    expect(r.overrideReasons).toContain(OVERRIDE_RULES[0]!.description);
  });

  it("R2 (A2=C): blocks only DBB, post-swap runner_up replaced since DBB is still blocked", () => {
    // DBB is blocked; CM/GC (runnerUp) is clean → swap to recommended=CM/GC, runnerUp=DBB.
    // Then the post-swap runner_up check fires: DBB is blocked, so replace with first
    // non-blocked FALLBACK_ORDER entry that isn't CM/GC → Design-Build/Best-Value.
    const r = applyOverrides("Design-Bid-Build", "CM/GC", { A2: "C" });
    expect(r.recommended).toBe("CM/GC");
    expect(r.runnerUp).toBe("Design-Build/Best-Value");
  });

  it("R5 (C2=C): favor Design-Build/Best-Value", () => {
    const r = applyOverrides("CM/GC", "Design-Bid-Build", { C2: "C" });
    expect(r.recommended).toBe("Design-Build/Best-Value");
    expect(r.runnerUp).toBe("CM/GC");
  });

  it("R5 favor doesn't apply when favor itself is blocked (e.g., R6+R5)", () => {
    const r = applyOverrides("CM/GC", "Progressive Design-Build", { C2: "C", E3: "A" });
    // R6 blocks DB-BV, DB-LB, PDB. R5 wants to favor DB-BV but it's blocked.
    expect(r.recommended).toBe("CM/GC");  // unchanged
  });

  it("R4 (B1=C AND B2=C): blocks DBB", () => {
    expect(applyOverrides("Design-Bid-Build", "CM/GC", { B1: "C", B2: "C" }).recommended).not.toBe("Design-Bid-Build");
    // Just B1=C alone shouldn't trigger
    expect(applyOverrides("Design-Bid-Build", "CM/GC", { B1: "C" }).recommended).toBe("Design-Bid-Build");
  });

  it("falls back to FALLBACK_ORDER when both recommended and runnerUp are blocked", () => {
    // R6 + R9 both block DB-BV/DB-LB/PDB; R3 blocks DBB+Design-Seq → only CM/GC remains
    const r = applyOverrides("Design-Bid-Build", "Progressive Design-Build", {
      A3: "C", E3: "A", F1: "A",
    });
    expect(r.recommended).toBe("CM/GC");
  });

  it("after swap, replaces blocked runner_up with first non-blocked from FALLBACK_ORDER", () => {
    // R1 (A1=C) blocks DBB + Design-Sequencing.
    // recommended=DBB (blocked), runnerUp=CM/GC (clean).
    // After swap: recommended=CM/GC, runnerUp=DBB (still blocked).
    // Expected: runnerUp replaced with first non-blocked from FALLBACK_ORDER that isn't CM/GC.
    const r = applyOverrides("Design-Bid-Build", "CM/GC", { A1: "C" });
    expect(r.recommended).toBe("CM/GC");
    expect(r.runnerUp).not.toBe("Design-Bid-Build");
    expect(r.runnerUp).not.toBe("CM/GC");
    // FALLBACK_ORDER is [CM/GC, DB-BV, DB-LB, PDB, Design-Sequencing, DBB]
    // First non-blocked, non-CM/GC = DB-BV
    expect(r.runnerUp).toBe("Design-Build/Best-Value");
  });

  it("returns all 9 rules in computeOverrideStatus regardless of triggers", () => {
    const status = computeOverrideStatus({});
    expect(status).toHaveLength(9);
    for (const s of status) {
      expect(s.triggered).toBe(false);
      expect(s.rule_id).toMatch(/^R[1-9]$/);
    }
  });

  it("computeOverrideStatus reflects current ratings", () => {
    const status = computeOverrideStatus({ A1: "C", B1: "C", B2: "C", E3: "A" });
    const triggered = status.filter((s) => s.triggered).map((s) => s.rule_id);
    expect(triggered).toEqual(expect.arrayContaining(["R1", "R4", "R6"]));
  });

  it("computeOverrideStatus.blocks is an array of method names", () => {
    const status = computeOverrideStatus({ A1: "C" });
    const r1 = status.find((s) => s.rule_id === "R1")!;
    expect(r1.blocks).toEqual(expect.arrayContaining(["Design-Bid-Build", "Design-Sequencing"]));
  });
});
