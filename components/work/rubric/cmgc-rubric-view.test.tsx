import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CmgcRubricView } from "./cmgc-rubric-view";
import { RUBRIC_QUESTIONS, SECTION_WEIGHTS } from "@/lib/usecases/cmgc-pde/rubric";

describe("CmgcRubricView", () => {
  it("renders one section header per distinct section in the rubric", () => {
    render(<CmgcRubricView />);
    const names = new Set(
      RUBRIC_QUESTIONS.map((q) => q.section.replace(/^[A-Z]:\s*/, "")),
    );
    for (const name of names) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("renders weight as a percent suffix in each section header chip", () => {
    render(<CmgcRubricView />);
    // Section headers read "N questions · 35%" for sections with weights.
    expect(
      screen.getAllByText(new RegExp(`· ${Math.round(SECTION_WEIGHTS.A * 100)}%`)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(new RegExp(`· ${Math.round(SECTION_WEIGHTS.F * 100)}%`)).length,
    ).toBeGreaterThan(0);
  });

  it("does NOT render the legacy standalone 'Section Weights' bar", () => {
    render(<CmgcRubricView />);
    expect(screen.queryByText(/^Section Weights$/i)).toBeNull();
  });
});
