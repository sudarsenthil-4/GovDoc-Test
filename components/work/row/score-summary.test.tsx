import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreSummary } from "./score-summary";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

function makeResult(status: EvaluationResult["status"], score: number): EvaluationResult {
  return { category: "Test", score, criteria_met: "", evidence: "", status, comments: "" };
}

describe("ScoreSummary", () => {
  it("renders correct counts and avg for mixed results", () => {
    const results: EvaluationResult[] = [
      // 10 Pass with score 5
      ...Array.from({ length: 10 }, () => makeResult("✅ Pass", 5)),
      // 2 Warning with score 3
      ...Array.from({ length: 2 }, () => makeResult("⚠️ Warning", 3)),
      // 5 Fail with score 1
      ...Array.from({ length: 5 }, () => makeResult("❌ Fail", 1)),
      // 3 N/A with score -1
      ...Array.from({ length: 3 }, () => makeResult("⚪ N/A", -1)),
      // 0 Error
    ];
    render(<ScoreSummary results={results} />);

    // Counts
    expect(screen.getByText("Pass").nextSibling?.textContent).toBe("10");
    expect(screen.getByText("Warning").nextSibling?.textContent).toBe("2");
    expect(screen.getByText("Fail").nextSibling?.textContent).toBe("5");
    expect(screen.getByText("N/A").nextSibling?.textContent).toBe("3");
    expect(screen.getByText("Error").nextSibling?.textContent).toBe("0");

    // avg = (10*5 + 2*3 + 5*1) / (10+2+5) = (50+6+5)/17 = 61/17 ≈ 3.59
    const avg = (10 * 5 + 2 * 3 + 5 * 1) / (10 + 2 + 5);
    expect(screen.getByText("Avg").nextSibling?.textContent).toBe(avg.toFixed(2));
  });

  it("renders all zeros and avg dash for empty results", () => {
    render(<ScoreSummary results={[]} />);
    expect(screen.getByText("Pass").nextSibling?.textContent).toBe("0");
    expect(screen.getByText("Warning").nextSibling?.textContent).toBe("0");
    expect(screen.getByText("Fail").nextSibling?.textContent).toBe("0");
    expect(screen.getByText("N/A").nextSibling?.textContent).toBe("0");
    expect(screen.getByText("Error").nextSibling?.textContent).toBe("0");
    expect(screen.getByText("Avg").nextSibling?.textContent).toBe("—");
  });
});
