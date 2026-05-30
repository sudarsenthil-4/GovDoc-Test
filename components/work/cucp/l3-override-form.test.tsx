import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { L3OverrideForm } from "./l3-override-form";

const criteria = [
  { s_no: "1", criterion: "DBE certification active" },
  { s_no: "2", criterion: "Eligible work classification" },
  { s_no: "3", criterion: "Truthful narrative" },
];

describe("L3OverrideForm", () => {
  it("offers Pass / Fail / Request Additional Information as verdict options", () => {
    render(<L3OverrideForm criteria={criteria} onSave={() => {}} />);
    const verdictSelect = screen.getByLabelText(/New verdict/i);
    const options = Array.from(verdictSelect.querySelectorAll("option")).map(
      (o) => o.textContent,
    );
    expect(options).toEqual(["Pass", "Fail", "Request Additional Information"]);
  });

  it("disables Save until reason is at least 15 characters", () => {
    render(<L3OverrideForm criteria={criteria} onSave={() => {}} />);
    const save = screen.getByRole("button", { name: /Save Override/i });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Reason/i), {
      target: { value: "12 characters" },
    });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Reason/i), {
      target: { value: "this is the full reason" },
    });
    expect(save).toBeEnabled();
  });

  it("emits request_info=Yes when 'Request Additional Information' is chosen", () => {
    const onSave = vi.fn();
    render(<L3OverrideForm criteria={criteria} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/New verdict/i), {
      target: { value: "Request Additional Information" },
    });
    fireEvent.change(screen.getByLabelText(/^Reason/i), {
      target: { value: "needs payment records, time" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        s_no: "1",
        verdict: "Fail",
        request_info: "Yes",
        reason: "needs payment records, time",
      }),
    );
  });

  it("emits Pass / request_info=No when verdict is Pass", () => {
    const onSave = vi.fn();
    render(<L3OverrideForm criteria={criteria} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/Criterion to override/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/^Reason/i), {
      target: { value: "additional context provided in section 4" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    expect(onSave).toHaveBeenCalledWith({
      s_no: "2",
      verdict: "Pass",
      request_info: "No",
      reason: "additional context provided in section 4",
    });
  });

  it("clears the reason field after a successful save", () => {
    const onSave = vi.fn();
    render(<L3OverrideForm criteria={criteria} onSave={onSave} />);
    const reason = screen.getByLabelText(/^Reason/i) as HTMLTextAreaElement;

    fireEvent.change(reason, { target: { value: "first override save reason" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(reason.value).toBe("");
  });

  it("renders all criteria in the criterion dropdown with #s_no — label", () => {
    render(<L3OverrideForm criteria={criteria} onSave={() => {}} />);
    const sel = screen.getByLabelText(/Criterion to override/i);
    const opts = Array.from(sel.querySelectorAll("option")).map((o) => o.textContent);
    expect(opts).toEqual([
      "#1 — DBE certification active",
      "#2 — Eligible work classification",
      "#3 — Truthful narrative",
    ]);
  });

  it("disables Save when the disabled prop is true even with a valid reason", () => {
    render(<L3OverrideForm criteria={criteria} onSave={() => {}} disabled={true} />);
    fireEvent.change(screen.getByLabelText(/^Reason/i), {
      target: { value: "long enough reason here" },
    });
    expect(screen.getByRole("button", { name: /Save Override/i })).toBeDisabled();
  });
});
