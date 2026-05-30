import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { PrecedentsAdminTable } from "./precedents-admin-table";
import type { Precedent } from "@/lib/usecases/cucp-reevals/memory/precedents";

const sample: Precedent[] = [
  { target: "X", correction: "Y", human_reasoning: "Z reason long enough" },
  { target: "A", correction: "B", human_reasoning: "C reason long enough", fact_id: "fact_2" },
];

describe("PrecedentsAdminTable", () => {
  it("renders columns Target / Correction / Reasoning / Link / (action)", () => {
    render(<PrecedentsAdminTable level={2} precedents={sample} onDelete={() => {}} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Target", "Correction", "Reasoning", "Link", ""]);
  });

  it("shows fact_id under Link for L2", () => {
    render(<PrecedentsAdminTable level={2} precedents={sample} onDelete={() => {}} />);
    expect(screen.getByText("fact_2")).toBeInTheDocument();
  });

  it("shows s_no=N under Link for L3", () => {
    const l3: Precedent[] = [{ target: "T", correction: "C", human_reasoning: "R long enough", s_no: 4 }];
    render(<PrecedentsAdminTable level={3} precedents={l3} onDelete={() => {}} />);
    expect(screen.getByText("s_no=4")).toBeInTheDocument();
  });

  it("calls onDelete with the index when Delete is clicked", () => {
    const onDelete = vi.fn();
    render(<PrecedentsAdminTable level={2} precedents={sample} onDelete={onDelete} />);
    const rows = screen.getAllByRole("row").slice(1);
    fireEvent.click(within(rows[0]!).getByRole("button", { name: /Delete/i }));
    expect(onDelete).toHaveBeenCalledWith(0);
  });

  it("renders an empty state when there are no precedents", () => {
    render(<PrecedentsAdminTable level={1} precedents={[]} onDelete={() => {}} />);
    expect(screen.getByText(/no precedents/i)).toBeInTheDocument();
  });
});
