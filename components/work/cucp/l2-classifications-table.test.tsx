import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  L2ClassificationsTable,
  L2_LEGAL_CATEGORIES,
} from "./l2-classifications-table";

const rows = [
  {
    fact_id: "fact_1",
    category: "Social Disadvantage",
    summary: "Owner cited gender-based bidding bias.",
    ai_reasoning: "Affidavit references multiple denied bids.",
  },
  {
    fact_id: "fact_2",
    category: "Ordinary Business Risk",
    summary: "Lost a contract due to pricing.",
    ai_reasoning: "No demographic factor cited.",
  },
];

describe("L2ClassificationsTable", () => {
  it("renders the four caltrans column headers verbatim", () => {
    render(<L2ClassificationsTable rows={rows} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Fact #", "Legal Category", "Summary", "AI Reasoning"]);
  });

  it("renders one row per classification", () => {
    render(<L2ClassificationsTable rows={rows} />);
    const dataRows = screen.getAllByRole("row").slice(1); // drop header
    expect(dataRows).toHaveLength(2);
    expect(dataRows[0]!.textContent).toMatch(/fact_1/);
    expect(dataRows[0]!.textContent).toMatch(/Social Disadvantage/);
    expect(dataRows[1]!.textContent).toMatch(/fact_2/);
    expect(dataRows[1]!.textContent).toMatch(/Ordinary Business Risk/);
  });

  it("exports the legal categories constant for reuse", () => {
    expect(L2_LEGAL_CATEGORIES).toEqual([
      "Keep Current (Fix Reasoning Only)",
      "Social Disadvantage",
      "Economic Disadvantage",
      "Institutional/Systemic Barrier",
      "Ordinary Business Risk",
      "Insufficient Evidence",
    ]);
  });
});
