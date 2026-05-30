import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { L2OverrideForm } from "./l2-override-form";

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

describe("L2OverrideForm", () => {
  it("offers all 6 caltrans-verbatim legal categories in the override dropdown", () => {
    render(<L2OverrideForm rows={rows} onSaveOverride={() => {}} />);
    const sel = screen.getByLabelText(/New category/i);
    const opts = Array.from(sel.querySelectorAll("option")).map((o) => o.textContent);
    expect(opts).toEqual([
      "Keep Current (Fix Reasoning Only)",
      "Social Disadvantage",
      "Economic Disadvantage",
      "Institutional/Systemic Barrier",
      "Ordinary Business Risk",
      "Insufficient Evidence",
    ]);
  });

  it("disables Save until reason is at least 15 chars", () => {
    render(<L2OverrideForm rows={rows} onSaveOverride={() => {}} />);
    const save = screen.getByRole("button", { name: /Save Override/i });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "long enough reason" },
    });
    expect(save).toBeEnabled();
  });

  it("emits the selected fact, category and reason on save", () => {
    const onSaveOverride = vi.fn();
    render(<L2OverrideForm rows={rows} onSaveOverride={onSaveOverride} />);

    fireEvent.change(screen.getByLabelText(/Fact #/i), { target: { value: "fact_2" } });
    fireEvent.change(screen.getByLabelText(/New category/i), {
      target: { value: "Institutional/Systemic Barrier" },
    });
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "Bid was tied to set-aside policy not skill." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    expect(onSaveOverride).toHaveBeenCalledWith({
      fact_id: "fact_2",
      new_category: "Institutional/Systemic Barrier",
      reason: "Bid was tied to set-aside policy not skill.",
    });
  });

  it("clears the reason field after a save", () => {
    const onSaveOverride = vi.fn();
    render(<L2OverrideForm rows={rows} onSaveOverride={onSaveOverride} />);
    const reason = screen.getByLabelText(/Legal Rationale/i) as HTMLTextAreaElement;
    fireEvent.change(reason, { target: { value: "this reason is long enough" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));
    expect(reason.value).toBe("");
  });

  it("disables Save when the disabled prop is true even with a valid reason", () => {
    render(<L2OverrideForm rows={rows} onSaveOverride={() => {}} disabled={true} />);
    fireEvent.change(screen.getByLabelText(/Legal Rationale/i), {
      target: { value: "long enough reason here" },
    });
    expect(screen.getByRole("button", { name: /Save Override/i })).toBeDisabled();
  });
});
