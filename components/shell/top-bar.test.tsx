import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopBar } from "./top-bar";

describe("TopBar", () => {
  it("renders the LLM at Scale.AI logo and user pill", () => {
    render(<TopBar user="joe" />);
    expect(screen.getByAltText(/llm at scale/i)).toBeInTheDocument();
    expect(screen.getByText(/joe/i)).toBeInTheDocument();
  });

  it("links the logo to /workspace", () => {
    render(<TopBar user="joe" />);
    const link = screen.getByAltText(/llm at scale/i).closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/workspace");
  });
});
