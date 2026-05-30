import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoreTable } from "./score-table";
import { useOverridesStore } from "@/store/use-overrides";
import { mockRatings } from "@/lib/usecases/cmgc-pde/scoring/fixtures";
import type { CmgcRating } from "@/lib/usecases/cmgc-pde/types";

beforeEach(() => {
  useOverridesStore.getState().clear();
});

describe("ScoreTable", () => {
  it("renders 25 rating rows", () => {
    render(<ScoreTable ratings={mockRatings()} />);
    expect(screen.getAllByRole("row")).toHaveLength(26); // 1 header + 25 data
  });

  it("displays AI rating in the AI Rating column", () => {
    render(<ScoreTable ratings={mockRatings({ A1: "C" })} />);
    const a1Row = screen.getByText("A1").closest("tr")!;
    expect(a1Row.textContent).toContain("C");
  });

  it("renders effective rating as plain text (no inline select)", () => {
    render(<ScoreTable ratings={mockRatings({ A1: "C" })} />);
    const a1Row = screen.getByText("A1").closest("tr")!;
    expect(a1Row.querySelector("span.font-medium")?.textContent).toBe("C");
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("effective rating reflects overrides written to the store", () => {
    useOverridesStore
      .getState()
      .push({ category: "A1", oldValue: "B", newValue: "C", reason: "test" });
    render(<ScoreTable ratings={mockRatings()} />);
    const a1Row = screen.getByText("A1").closest("tr")!;
    expect(a1Row.querySelector("span.font-medium")?.textContent).toBe("C");
  });

  it("does not render undo or clear toolbar buttons", () => {
    render(<ScoreTable ratings={mockRatings()} />);
    expect(screen.queryByRole("button", { name: /undo/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /clear all overrides/i })).toBeNull();
  });

  it("renders 'edited' indicator on the AI Rating cell when an override exists", () => {
    useOverridesStore
      .getState()
      .push({ category: "A1", oldValue: "A", newValue: "C", reason: "Reviewer correction." });
    render(<ScoreTable ratings={mockRatings({ A1: "A" })} />);
    expect(screen.getByText(/edited/i)).toBeInTheDocument();
  });

  it("labels the source column 'Source'", () => {
    render(<ScoreTable ratings={mockRatings()} />);
    expect(screen.getByText(/^Source$/i)).toBeInTheDocument();
  });

  it("does not render a separate Effective column header", () => {
    render(<ScoreTable ratings={mockRatings()} />);
    expect(screen.queryByText(/^Effective$/i)).toBeNull();
  });
});

function makeRating(overrides: Partial<CmgcRating> = {}): CmgcRating {
  return {
    question_id: "A1",
    question_text: "Project size?",
    source_reasoning: "Plans show 60% complete.",
    missing_info_reasoning: "",
    selected_rating: "B",
    confidence: 0.7,
    missing_info: false,
    ...overrides,
  };
}

describe("ScoreTable defensive rendering", () => {
  beforeEach(() => {
    useOverridesStore.getState().clear();
  });

  it("renders all fields normally for a well-formed rating", () => {
    render(<ScoreTable ratings={[makeRating()]} />);
    expect(screen.getByText("A1")).toBeTruthy();
    expect(screen.getByText("Project size?")).toBeTruthy();
    expect(screen.getByText("0.70")).toBeTruthy();
  });

  it("renders an em-dash for undefined selected_rating", () => {
    const broken = makeRating({ selected_rating: undefined as unknown as CmgcRating["selected_rating"] });
    render(<ScoreTable ratings={[broken]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("renders an em-dash for empty-string selected_rating (missing-info case)", () => {
    const missing = makeRating({
      selected_rating: "" as unknown as CmgcRating["selected_rating"],
      missing_info: true,
      confidence: 0.0,
    });
    render(<ScoreTable ratings={[missing]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("renders an em-dash for undefined confidence", () => {
    const broken = makeRating({ confidence: undefined as unknown as number });
    render(<ScoreTable ratings={[broken]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("renders an em-dash for undefined source_reasoning", () => {
    const broken = makeRating({ source_reasoning: undefined as unknown as string });
    render(<ScoreTable ratings={[broken]} />);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("does not crash when question_id is undefined", () => {
    const broken = makeRating({ question_id: undefined as unknown as string });
    expect(() => render(<ScoreTable ratings={[broken]} />)).not.toThrow();
  });
});
