import { describe, it, expect } from "vitest";
import type { EvaluationResult } from "../types";
import { enforceConsistency } from "./enforce-consistency";

function makeResult(category: string, score: number, extra: Partial<EvaluationResult> = {}): EvaluationResult {
  return {
    category,
    score,
    criteria_met: "ok",
    evidence: "",
    status: score === -1 ? "⚪ N/A" : score >= 4 ? "✅ Pass" : score === 1 ? "❌ Fail" : "⚠️ Warning",
    comments: "",
    ...extra,
  };
}

describe("enforceConsistency", () => {
  it("Rule 1: Certificate=Score 1 forces Delegations down to Score 1 with Fail status", () => {
    const cert = makeResult("Certificate of Appraiser", 1);
    const deleg = makeResult("Delegations", 5);
    const result = enforceConsistency([cert, deleg]);
    const outDeleg = result.find((r) => r.category === "Delegations")!;
    expect(outDeleg.score).toBe(1);
    expect(outDeleg.status).toBe("❌ Fail");
  });

  it("Rule 2: HABU Improved=N/A forces HABU Reconciliation to N/A", () => {
    const habi = makeResult("HABU Improved", -1);
    const habr = makeResult("HABU Reconciliation", 4);
    const result = enforceConsistency([habi, habr]);
    const outHabr = result.find((r) => r.category === "HABU Reconciliation")!;
    expect(outHabr.score).toBe(-1);
    expect(outHabr.status).toBe("⚪ N/A");
  });

  it("Rule 3: HABU Vacant=Score 5 with buyer-missing signal in comments → downgraded to Score 3 Warning", () => {
    const habv = makeResult("HABU Vacant", 5, { comments: "most likely buyer is not explicitly stated" });
    const result = enforceConsistency([habv]);
    const outHabv = result.find((r) => r.category === "HABU Vacant")!;
    expect(outHabv.score).toBe(3);
    expect(outHabv.status).toBe("⚠️ Warning");
  });

  it("Rule 3: HABU Vacant=Score 5 with explicit buyer statement → unchanged", () => {
    const habv = makeResult("HABU Vacant", 5, { comments: "The most likely buyer is a developer seeking commercial land." });
    const result = enforceConsistency([habv]);
    const outHabv = result.find((r) => r.category === "HABU Vacant")!;
    expect(outHabv.score).toBe(5);
    expect(outHabv.status).toBe("✅ Pass");
  });

  it("No rules trigger when Certificate=Score 5 and Delegations=Score 5", () => {
    const cert = makeResult("Certificate of Appraiser", 5);
    const deleg = makeResult("Delegations", 5);
    const result = enforceConsistency([cert, deleg]);
    const outDeleg = result.find((r) => r.category === "Delegations")!;
    expect(outDeleg.score).toBe(5);
    expect(outDeleg.status).toBe("✅ Pass");
  });
});
