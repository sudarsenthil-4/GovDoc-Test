import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RowResultTabs } from "./result-tabs";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";

const resultsWithFailure: EvaluationResult[] = [
  { category: "Title Page", score: 5, status: "✅ Pass", criteria_met: "", evidence: "", comments: "ok" },
  { category: "Improvements", score: 1, status: "❌ Fail", criteria_met: "", evidence: "Missing", comments: "" },
];

const allPassResults: EvaluationResult[] = [
  { category: "Title Page", score: 5, status: "✅ Pass", criteria_met: "", evidence: "", comments: "ok" },
  { category: "Improvements", score: 4, status: "✅ Pass", criteria_met: "", evidence: "", comments: "" },
];

describe("RowResultTabs", () => {
  it("renders three tabs labelled like caltrans", () => {
    render(<RowResultTabs results={resultsWithFailure} />);
    expect(screen.getByRole("tab", { name: /executive summary/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /detailed findings/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /action items/i })).toBeInTheDocument();
  });

  it("starts on Detailed Findings when any category failed", () => {
    render(<RowResultTabs results={resultsWithFailure} />);
    expect(screen.getByRole("tab", { name: /detailed findings/i })).toHaveAttribute("data-selected", "true");
  });

  it("starts on Executive Summary when all categories passed", () => {
    render(<RowResultTabs results={allPassResults} />);
    expect(screen.getByRole("tab", { name: /executive summary/i })).toHaveAttribute("data-selected", "true");
  });

  it("switches to Action Items when clicked", () => {
    render(<RowResultTabs results={resultsWithFailure} />);
    fireEvent.click(screen.getByRole("tab", { name: /action items/i }));
    expect(screen.getByRole("tab", { name: /action items/i })).toHaveAttribute("data-selected", "true");
  });
});
