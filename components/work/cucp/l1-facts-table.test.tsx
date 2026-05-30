import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { L1FactsTable } from "./l1-facts-table";
import type { ExtractedFact } from "@/lib/usecases/cucp-reevals/types";

const facts: ExtractedFact[] = [
  {
    id: "fact_1",
    when: "2018",
    where: "California",
    who: "Owner",
    what: "Took out personal loan to fund startup",
    why: "Family business",
    magnitude: "$50k",
    demographic_flag: true,
    source_quote: "I borrowed against my home to launch the firm.",
  },
  {
    id: "fact_2",
    when: "2020",
    where: "Caltrans HQ",
    who: "Project Manager",
    what: "Awarded subcontract",
    why: "Specialty work",
    magnitude: "$1.2M",
    demographic_flag: false,
    source_quote: "",
  },
];

describe("L1FactsTable", () => {
  it("renders the 9 caltrans column headers verbatim", () => {
    render(<L1FactsTable facts={facts} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual([
      "Fact #",
      "When",
      "Where",
      "Who",
      "What",
      "Why",
      "Magnitude/Threshold",
      "Demographics Checkbox",
      "Source Quote",
    ]);
  });

  it("renders one row per fact", () => {
    render(<L1FactsTable facts={facts} />);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3); // header + 2 data rows
  });

  it("displays demographic_flag as Yes / blank checkbox column", () => {
    render(<L1FactsTable facts={facts} />);
    const rows = screen.getAllByRole("row");
    const fact1Cells = within(rows[1]!).getAllByRole("cell");
    const fact2Cells = within(rows[2]!).getAllByRole("cell");
    // Demographics Checkbox is column index 7 (0-based after Fact #/When/Where/Who/What/Why/Magnitude)
    expect(fact1Cells[7]!.textContent).toMatch(/yes/i);
    expect(fact2Cells[7]!.textContent).not.toMatch(/yes/i);
  });

  it("renders em-dash for blank source quote", () => {
    render(<L1FactsTable facts={facts} />);
    const rows = screen.getAllByRole("row");
    const fact2Cells = within(rows[2]!).getAllByRole("cell");
    expect(fact2Cells[8]!.textContent).toBe("—");
  });

  it("shows empty-state message when facts list is empty", () => {
    render(<L1FactsTable facts={[]} />);
    expect(screen.getByText(/no facts extracted/i)).toBeTruthy();
  });
});
