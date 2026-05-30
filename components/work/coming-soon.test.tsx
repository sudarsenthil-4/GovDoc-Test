import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { ComingSoon } from "./coming-soon";

describe("ComingSoon", () => {
  it("renders title and blurb without an icon or back link by default", () => {
    render(<ComingSoon title="Draft" blurb="Drafting workbench." />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Drafting workbench.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /back to dashboard/i })).toBeNull();
  });

  it("renders the icon when provided", () => {
    render(<ComingSoon title="OCR" blurb="Pull text." icon={Search} />);
    // lucide-react renders SVGs with class lucide-search
    expect(document.querySelector("svg.lucide-search")).not.toBeNull();
  });

  it("renders a back-to-dashboard link when backHref is provided", () => {
    render(<ComingSoon title="OCR" blurb="..." backHref="/workspace" />);
    const link = screen.getByRole("link", { name: /back to dashboard/i });
    expect(link).toHaveAttribute("href", "/workspace");
  });
});
