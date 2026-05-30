import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FindingsTable } from "./findings-table";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

function r(category: string, score: number): EvaluationResult {
  return {
    category,
    score,
    criteria_met: "x",
    evidence: "main evidence",
    status: "✅ Pass",
    comments: "comments",
  };
}

describe("FindingsTable", () => {
  it("marks rules at or below the achieved score as Pass and above as Fail", () => {
    // Title Page rubric_schema has levels 1, 2, 3, 5 (no 4). Score 3 satisfies 1, 2, 3.
    render(<FindingsTable results={[r("Title Page", 3)]} />);
    const passes = screen.getAllByText(/^Pass$/);
    const fails = screen.getAllByText(/^Fail$/);
    expect(passes.length).toBe(3);
    expect(fails.length).toBe(1);
  });

  it("renders all rule levels as N/A when score is -1", () => {
    render(<FindingsTable results={[r("Title Page", -1)]} />);
    const naBadges = screen.getAllByText(/^N\/A$/);
    expect(naBadges.length).toBeGreaterThanOrEqual(3);
  });

  it("skips categories absent from the rubric", () => {
    const { container } = render(<FindingsTable results={[r("Bogus", 3)]} />);
    expect(container.querySelectorAll("tbody tr").length).toBe(0);
  });

  it("colors the Met cell with the Pass tone", () => {
    const results = [
      { category: "Title Page", score: 5, status: "✅ Pass", criteria_met: "", evidence: "", comments: "" },
    ];
    // @ts-expect-error structural input
    const { container } = render(<FindingsTable results={results} />);
    const passCell = container.querySelector("[data-rule-status='Pass']");
    expect(passCell?.className).toContain("bg-card");
  });
});
