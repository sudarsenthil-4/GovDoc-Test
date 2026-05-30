import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActionItems } from "./action-items";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

function r(category: string, score: number, evidence = "Evidence text", comments = "Comments"): EvaluationResult {
  return {
    category,
    score,
    criteria_met: "criteria",
    evidence,
    status: score === -1 ? "⚪ N/A" : score >= 4 ? "✅ Pass" : score === 3 ? "⚠️ Warning" : "❌ Fail",
    comments,
  };
}

describe("ActionItems", () => {
  it("skips score=5 and N/A categories", () => {
    render(<ActionItems results={[r("Title Page", 5), r("RW 7-9", -1)]} />);
    expect(screen.getByText(/No action items/i)).toBeDefined();
  });

  it("sorts HIGH before MEDIUM before LOW", () => {
    const results = [
      r("Title Page", 4),       // LOW
      r("RW 7-9", 1),           // HIGH
      r("Subject Photos", 3),   // MEDIUM
    ];
    render(<ActionItems results={results} />);
    const cells = screen.getAllByRole("cell").filter((c) =>
      ["HIGH", "MEDIUM", "LOW"].includes(c.textContent?.trim() ?? ""),
    );
    expect(cells.map((c) => c.textContent?.trim())).toEqual(["HIGH", "MEDIUM", "LOW"]);
  });

  it("prepends CRITICAL when score<=2 and evidence has NOT FOUND", () => {
    render(<ActionItems results={[r("Title Page", 1, "Title Page is NOT FOUND in document")]} />);
    expect(screen.getByText(/CRITICAL:/)).toBeDefined();
  });

  it("uses default template for unknown categories", () => {
    render(<ActionItems results={[r("Mystery Category", 2)]} />);
    expect(screen.getByText(/Review Mystery Category/)).toBeDefined();
  });
});
