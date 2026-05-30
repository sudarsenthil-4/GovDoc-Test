import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SearchAskPage from "./page";

describe("SearchAskPage (Review / Manage picker)", () => {
  it("renders both option cards", () => {
    render(<SearchAskPage />);
    // Title text is split across <h3>Review <em>Rubrics</em></h3>; assert on the
    // accent-only piece that uniquely identifies each tile.
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Manage")).toBeInTheDocument();
  });

  it("does not surface the old 'Preview' tile label in this Search & Ask context", () => {
    render(<SearchAskPage />);
    // The Review/Preview rename: in Search & Ask the tile reads 'Review'.
    expect(screen.queryByText(/^Preview$/)).toBeNull();
  });

  it("Review links to /work/search/preview", () => {
    render(<SearchAskPage />);
    const link = screen.getByText("Review").closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/work/search/preview");
  });

  it("Manage links to /work/search/edit", () => {
    render(<SearchAskPage />);
    const link = screen.getByText("Manage").closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/work/search/edit");
  });
});
