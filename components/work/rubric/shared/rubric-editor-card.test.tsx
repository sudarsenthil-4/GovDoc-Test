import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RubricEditorCard, type EditorField } from "./rubric-editor-card";

const fields: EditorField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
];

describe("RubricEditorCard", () => {
  it("renders the title and field labels", () => {
    render(
      <RubricEditorCard
        mode="create"
        title="New category"
        fields={fields}
        initialValues={{ name: "", description: "" }}
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("New category")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("calls onSave with the collected values", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <RubricEditorCard
        mode="create"
        title="New"
        fields={fields}
        initialValues={{ name: "", description: "" }}
        onSave={onSave}
        onCancel={() => {}}
      />,
    );
    await user.type(screen.getByLabelText("Name"), "Hello");
    await user.type(screen.getByLabelText("Description"), "world");
    await user.click(screen.getByRole("button", { name: /Save/i }));
    expect(onSave).toHaveBeenCalledWith({ name: "Hello", description: "world" });
  });

  it("blocks save when a required field is empty", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <RubricEditorCard
        mode="create"
        title="New"
        fields={fields}
        initialValues={{ name: "", description: "" }}
        onSave={onSave}
        onCancel={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Save/i }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <RubricEditorCard
        mode="edit"
        title="Edit thing"
        fields={fields}
        initialValues={{ name: "x", description: "y" }}
        onSave={() => {}}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("constrains the dialog height and scrolls the body region so long forms remain navigable", () => {
    const { container } = render(
      <RubricEditorCard
        mode="create"
        title="Tall form"
        fields={fields}
        initialValues={{ name: "", description: "" }}
        onSave={() => {}}
        onCancel={() => {}}
      />,
    );
    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.className).toMatch(/max-h-\[90vh\]/);
    expect(dialog.className).toMatch(/flex(-col)?/);
    // Body region must scroll, not the whole dialog.
    const body = dialog.querySelector(".overflow-y-auto") as HTMLElement;
    expect(body).not.toBeNull();
  });
});
