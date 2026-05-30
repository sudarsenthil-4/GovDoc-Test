import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateRubricDialog } from "./create-rubric-dialog";

const rubrics = [
  { id: "default", label: "Default", isDefault: true, createdAt: "2026-05-14T00:00:00Z" },
] as const;

describe("CreateRubricDialog", () => {
  it("auto-fills the ID from the label as a kebab slug", async () => {
    const user = userEvent.setup();
    render(<CreateRubricDialog rubrics={rubrics} onSave={async () => {}} onCancel={() => {}} />);
    await user.type(screen.getByLabelText("Label"), "DBE Pilot Q2");
    const idInput = screen.getByLabelText("ID") as HTMLInputElement;
    expect(idInput.value).toBe("dbe-pilot-q2");
  });

  it("blocks save until a non-empty label and a valid ID are present", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => {});
    render(<CreateRubricDialog rubrics={rubrics} onSave={onSave} onCancel={() => {}} />);
    const saveBtn = screen.getByRole("button", { name: /Create rubric/i });
    expect(saveBtn).toBeDisabled();
    await user.type(screen.getByLabelText("Label"), "Pilot");
    expect(saveBtn).toBeEnabled();
  });

  it("blocks save when the auto-generated ID collides with an existing rubric", async () => {
    const user = userEvent.setup();
    render(<CreateRubricDialog rubrics={rubrics} onSave={async () => {}} onCancel={() => {}} />);
    await user.type(screen.getByLabelText("Label"), "Default");
    expect(screen.getByRole("button", { name: /Create rubric/i })).toBeDisabled();
    expect(screen.getByText(/already exists/i)).toBeInTheDocument();
  });

  it("passes id, label, and (optional) cloneFrom to onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => {});
    render(<CreateRubricDialog rubrics={rubrics} onSave={onSave} onCancel={() => {}} />);
    await user.type(screen.getByLabelText("Label"), "Pilot Q2");
    // cloneFrom defaults to the existing default rubric.
    fireEvent.click(screen.getByRole("button", { name: /Create rubric/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(onSave).toHaveBeenCalledWith({
      id: "pilot-q2",
      label: "Pilot Q2",
      cloneFrom: "default",
    });
  });

  it("surfaces the error from onSave inline", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => {
      throw new Error("Rubric id already exists: pilot");
    });
    render(<CreateRubricDialog rubrics={rubrics} onSave={onSave} onCancel={() => {}} />);
    await user.type(screen.getByLabelText("Label"), "Pilot");
    fireEvent.click(screen.getByRole("button", { name: /Create rubric/i }));
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText(/Rubric id already exists: pilot/i)).toBeInTheDocument();
  });

  it("calls onCancel on Cancel click", () => {
    const onCancel = vi.fn();
    render(<CreateRubricDialog rubrics={rubrics} onSave={async () => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
