import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { L1OverrideForm } from "./l1-override-form";
import type { ExtractedFact } from "@/lib/usecases/cucp-reevals/types";

const facts: ExtractedFact[] = [
  { id: "fact_1", when: "2018", where: "CA", who: "owner", what: "loan", why: "", magnitude: "", demographic_flag: false, source_quote: "" },
  { id: "fact_2", when: "2019", where: "CA", who: "owner", what: "denied bid", why: "", magnitude: "", demographic_flag: false, source_quote: "" },
];

const baseProps = {
  facts,
  onSubmitOverride: vi.fn(),
  onUndo: vi.fn(),
  onClear: vi.fn(),
  stagedCount: 0,
  persistentCount: 0,
};

describe("L1OverrideForm", () => {
  it("renders inside a collapsible expander, collapsed by default", () => {
    render(<L1OverrideForm {...baseProps} />);
    const summary = screen.getByText(/Structural issue\? Click here to correct/i);
    expect(summary).toBeTruthy();
    // jsdom doesn't auto-render <details> children when closed, but the form
    // controls live inside; querying for them returns the element regardless.
    // The visual collapse is browser-driven. This test just confirms the
    // disclosure markup exists.
    expect(summary.tagName).toBe("SUMMARY");
  });

  it("shows target options Fact 1, Fact 2, Firm Name, Narrative Declared PNW, Specific Incident Detail", () => {
    render(<L1OverrideForm {...baseProps} />);
    const select = screen.getByLabelText(/What to Correct/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.text);
    expect(options).toEqual([
      "Fact fact_1",
      "Fact fact_2",
      "Firm Name",
      "Narrative Declared PNW",
      "Specific Incident Detail",
    ]);
  });

  it("disables 'Which Field' when target is Firm Name", () => {
    render(<L1OverrideForm {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/What to Correct/i), { target: { value: "Firm Name" } });
    expect((screen.getByLabelText(/Which Field/i) as HTMLSelectElement).disabled).toBe(true);
  });

  it("disables submit when reason < 15 chars", () => {
    render(<L1OverrideForm {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/Corrected Value/i), { target: { value: "2020" } });
    fireEvent.change(screen.getByLabelText(/Reasoning/i), { target: { value: "too short" } });
    expect((screen.getByRole("button", { name: /Apply Correction & Re-Evaluate/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("submits a fact-field override with the right shape", () => {
    const onSubmit = vi.fn();
    render(<L1OverrideForm {...baseProps} onSubmitOverride={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/What to Correct/i), { target: { value: "Fact fact_1" } });
    fireEvent.change(screen.getByLabelText(/Which Field/i), { target: { value: "When" } });
    fireEvent.change(screen.getByLabelText(/Corrected Value/i), { target: { value: "2020" } });
    fireEvent.change(screen.getByLabelText(/Reasoning/i), { target: { value: "narrative explicitly says 2020" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply Correction & Re-Evaluate/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      kind: "fact-field",
      fact_id: "fact_1",
      field: "When",
      corrected_value: "2020",
      reason: "narrative explicitly says 2020",
    });
  });

  it("submits a firm-name override when target is 'Firm Name'", () => {
    const onSubmit = vi.fn();
    render(<L1OverrideForm {...baseProps} onSubmitOverride={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/What to Correct/i), { target: { value: "Firm Name" } });
    fireEvent.change(screen.getByLabelText(/Correct Firm Name/i), { target: { value: "Acme, LLC." } });
    fireEvent.change(screen.getByLabelText(/Reasoning/i), { target: { value: "matches incorporation documents" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply Correction & Re-Evaluate/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      kind: "firm-name",
      corrected_value: "Acme, LLC.",
      reason: "matches incorporation documents",
    });
  });

  it("submits a specific-incident override with description in place of value", () => {
    const onSubmit = vi.fn();
    render(<L1OverrideForm {...baseProps} onSubmitOverride={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/What to Correct/i), { target: { value: "Specific Incident Detail" } });
    fireEvent.change(screen.getByLabelText(/Describe the missing or incorrect incident/i), { target: { value: "Owner cited 2019 loan denial on page 4" } });
    fireEvent.change(screen.getByLabelText(/Reasoning/i), { target: { value: "missed by AI on first pass" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply Correction & Re-Evaluate/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      kind: "specific-incident",
      description: "Owner cited 2019 loan denial on page 4",
      reason: "missed by AI on first pass",
    });
  });

  it("shows Undo + Clear buttons only when stagedCount > 0", () => {
    const { rerender } = render(<L1OverrideForm {...baseProps} stagedCount={0} />);
    expect(screen.queryByRole("button", { name: /Undo Last/i })).toBeNull();

    rerender(<L1OverrideForm {...baseProps} stagedCount={1} />);
    expect(screen.queryByRole("button", { name: /Undo Last/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Clear All/i })).toBeTruthy();
  });

  it("shows yellow warning at >= 36 staged+persistent total", () => {
    render(<L1OverrideForm {...baseProps} stagedCount={20} persistentCount={16} />);
    expect(screen.getByText(/Approaching correction limit/i)).toBeTruthy();
  });

  it("disables submit at >= 45 total and shows red error", () => {
    render(<L1OverrideForm {...baseProps} stagedCount={25} persistentCount={20} />);
    fireEvent.change(screen.getByLabelText(/Corrected Value/i), { target: { value: "2020" } });
    fireEvent.change(screen.getByLabelText(/Reasoning/i), { target: { value: "long enough reason text" } });
    expect((screen.getByRole("button", { name: /Apply Correction & Re-Evaluate/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Correction limit reached/i)).toBeTruthy();
  });
});
