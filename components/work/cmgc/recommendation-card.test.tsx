import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecommendationCard } from "./recommendation-card";
import { mockRunResult } from "@/lib/usecases/cmgc-pde/scoring/fixtures";

describe("RecommendationCard", () => {
  it("displays the recommended method as a heading", () => {
    const r = mockRunResult();
    render(<RecommendationCard recommendation={r.recommendation} />);
    expect(screen.getByRole("heading", { name: r.recommendation.recommended_method })).toBeDefined();
  });

  it("shows the composite score formatted to 3 decimals", () => {
    const r = mockRunResult();
    render(<RecommendationCard recommendation={r.recommendation} />);
    expect(screen.getByText(/Composite \d\.\d{3} \/ 3\.000/)).toBeDefined();
  });

  it("shows borderline chip when is_borderline true", () => {
    const r = mockRunResult();
    r.recommendation.is_borderline = true;
    render(<RecommendationCard recommendation={r.recommendation} />);
    expect(screen.getByTestId("borderline-chip")).toBeDefined();
  });

  it("hides borderline chip when is_borderline false", () => {
    const r = mockRunResult();
    r.recommendation.is_borderline = false;
    render(<RecommendationCard recommendation={r.recommendation} />);
    expect(screen.queryByTestId("borderline-chip")).toBeNull();
  });

  it("renders override reasons as a bulleted list", () => {
    const r = mockRunResult();
    r.recommendation.override_reasons = ["Reason A", "Reason B"];
    render(<RecommendationCard recommendation={r.recommendation} />);
    expect(screen.getByText("Reason A")).toBeDefined();
    expect(screen.getByText("Reason B")).toBeDefined();
  });

  it("does NOT render override section when empty", () => {
    const r = mockRunResult();
    r.recommendation.override_reasons = [];
    render(<RecommendationCard recommendation={r.recommendation} />);
    expect(screen.queryByText(/Override Reasons/i)).toBeNull();
  });
});
