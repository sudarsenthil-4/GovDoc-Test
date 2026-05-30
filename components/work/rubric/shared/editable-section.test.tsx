import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableSection } from "./editable-section";

const items = [
  { id: "q1", text: "Question 1" },
  { id: "q2", text: "Question 2" },
];

describe("EditableSection", () => {
  it("renders the section title and row content", async () => {
    render(
      <EditableSection
        sectionKey="A"
        title="Scope"
        items={items}
        renderRow={(it) => <span>{it.text}</span>}
        onAdd={() => {}}
        onEditItem={() => {}}
        onDeleteItem={() => {}}
        countLabel="question"
        defaultOpen
      />,
    );
    expect(screen.getByText("Scope")).toBeInTheDocument();
    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });

  it("fires onAdd when the + Add button is clicked", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <EditableSection
        title="Scope"
        items={items}
        renderRow={(it) => <span>{it.text}</span>}
        onAdd={onAdd}
        onEditItem={() => {}}
        onDeleteItem={() => {}}
        countLabel="question"
        defaultOpen
      />,
    );
    await user.click(screen.getByRole("button", { name: /\+ Add question/i }));
    expect(onAdd).toHaveBeenCalled();
  });

  it("fires onEditItem/onDeleteItem with the item id", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDel = vi.fn();
    render(
      <EditableSection
        title="Scope"
        items={items}
        renderRow={(it) => <span>{it.text}</span>}
        onAdd={() => {}}
        onEditItem={onEdit}
        onDeleteItem={onDel}
        countLabel="question"
        defaultOpen
      />,
    );
    await user.click(screen.getAllByRole("button", { name: /Edit Question 1/i })[0]!);
    expect(onEdit).toHaveBeenCalledWith("q1");
    await user.click(screen.getAllByRole("button", { name: /Delete Question 2/i })[0]!);
    expect(onDel).toHaveBeenCalledWith("q2");
  });

  it("renders custom children when provided, replacing the items list", () => {
    render(
      <EditableSection
        title="ROW"
        items={[]}
        renderRow={() => null}
        onAdd={() => {}}
        onEditItem={() => {}}
        onDeleteItem={() => {}}
        countLabel="tier"
        defaultOpen
      >
        <div data-testid="custom-body">custom</div>
      </EditableSection>,
    );
    expect(screen.getByTestId("custom-body")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\+ Add tier/i })).not.toBeInTheDocument();
  });
});
