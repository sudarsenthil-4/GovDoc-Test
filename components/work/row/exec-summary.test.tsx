import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExecSummary } from "./exec-summary";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

function r(category: string, score: number, comments = "Comments"): EvaluationResult {
  return {
    category,
    score,
    criteria_met: "x",
    evidence: "x",
    status: "✅ Pass",
    comments,
  };
}

describe("ExecSummary", () => {
  it("renders Pass for score 4-5, Warning for 3, Fail for 1-2, N/A for -1", () => {
    render(
      <ExecSummary
        results={[
          r("Pass5", 5),
          r("Pass4", 4),
          r("Warn", 3),
          r("Fail2", 2),
          r("Fail1", 1),
          r("NA", -1),
        ]}
      />,
    );
    expect(screen.getAllByText(/^Pass$/).length).toBe(2);
    expect(screen.getByText(/^Warning$/)).toBeDefined();
    expect(screen.getAllByText(/^Fail$/).length).toBe(2);
    expect(screen.getAllByText(/N\/A/).length).toBeGreaterThan(0);
  });

  it("applies the Pass background to the status cell when score >= 4", () => {
    const results = [{ category: "Title Page", score: 5, status: "✅ Pass", criteria_met: "", evidence: "", comments: "ok" }];
    // @ts-expect-error structural input is fine for this test
    const { container } = render(<ExecSummary results={results} />);
    const statusCell = container.querySelector('[data-status="Pass"]');
    expect(statusCell?.className).toContain("bg-card");
  });

  it("applies a left border colored by status on each row", () => {
    const results = [
      { category: "Title Page", score: 1, status: "❌ Fail", criteria_met: "", evidence: "", comments: "" },
      { category: "Improvements", score: 5, status: "✅ Pass", criteria_met: "", evidence: "", comments: "" },
    ];
    // @ts-expect-error structural input is fine for this test
    const { container } = render(<ExecSummary results={results} />);
    const rows = container.querySelectorAll("tbody tr");
    expect((rows[0] as HTMLTableRowElement).className).toContain("border-l-destructive");
    expect((rows[1] as HTMLTableRowElement).className).toContain("border-l-primary");
  });
});
