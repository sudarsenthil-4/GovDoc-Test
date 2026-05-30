import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportView } from "./report-view";

describe("ReportView", () => {
  it("renders a markdown heading as an <h1>", () => {
    render(<ReportView markdown="# CUCP Report\n\nSome body." />);
    expect(screen.getByRole("heading", { level: 1, name: /cucp report/i })).toBeDefined();
  });

  it("renders body paragraphs", () => {
    render(<ReportView markdown="hello body text" />);
    expect(screen.getByText(/hello body text/i)).toBeDefined();
  });

  it("renders GFM pipe tables as real <table> elements", () => {
    const md = [
      "| S. No | Category | Pass |",
      "|---|---|---|",
      "| 1 | Burden of Proof | Yes |",
    ].join("\n");
    render(<ReportView markdown={md} />);
    expect(screen.getByRole("table")).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /S\. No/i })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /Pass/i })).toBeDefined();
    expect(screen.getByRole("cell", { name: /Burden of Proof/i })).toBeDefined();
  });
});
