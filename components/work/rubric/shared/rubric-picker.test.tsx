import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RubricPicker } from "./rubric-picker";

const rubrics = [
  { id: "default", label: "Default", isDefault: true, createdAt: "2026-05-14T00:00:00Z" },
  { id: "pilot", label: "DBE Pilot", isDefault: false, createdAt: "2026-05-14T00:00:00Z" },
] as const;

describe("RubricPicker", () => {
  it("renders the currently-selected label with a Default chip when applicable", () => {
    render(
      <RubricPicker
        rubrics={rubrics}
        selectedId="default"
        onSelect={() => {}}
        mode="read-only"
      />,
    );
    expect(screen.getByRole("button", { name: /Default/i })).toBeInTheDocument();
  });

  it("opens the listbox on click and emits onSelect for a different option", () => {
    const onSelect = vi.fn();
    render(
      <RubricPicker rubrics={rubrics} selectedId="default" onSelect={onSelect} mode="read-only" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Default/i }));
    fireEvent.click(screen.getByRole("option", { name: /DBE Pilot/i }));
    expect(onSelect).toHaveBeenCalledWith("pilot");
  });

  it("does not emit onSelect when the active option is re-clicked", () => {
    const onSelect = vi.fn();
    render(
      <RubricPicker rubrics={rubrics} selectedId="default" onSelect={onSelect} mode="read-only" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Default/i }));
    fireEvent.click(screen.getByRole("option", { name: /^Default/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("in read-only mode does NOT show admin action buttons", () => {
    render(
      <RubricPicker
        rubrics={rubrics}
        selectedId="pilot"
        onSelect={() => {}}
        mode="read-only"
        onCreateClick={() => {}}
        onSetDefault={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: /New rubric/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Set as default/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Delete rubric/i })).toBeNull();
  });

  it("in manage mode surfaces Create + (when non-default selected) Set-default and Delete", () => {
    const onCreateClick = vi.fn();
    const onSetDefault = vi.fn();
    const onDelete = vi.fn();
    render(
      <RubricPicker
        rubrics={rubrics}
        selectedId="pilot"
        onSelect={() => {}}
        mode="manage"
        onCreateClick={onCreateClick}
        onSetDefault={onSetDefault}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /New rubric/i }));
    expect(onCreateClick).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Set as default/i }));
    expect(onSetDefault).toHaveBeenCalledWith("pilot");
    fireEvent.click(screen.getByRole("button", { name: /Delete rubric/i }));
    expect(onDelete).toHaveBeenCalledWith("pilot");
  });

  it("in manage mode does NOT show Set-default / Delete when the default rubric is selected", () => {
    render(
      <RubricPicker
        rubrics={rubrics}
        selectedId="default"
        onSelect={() => {}}
        mode="manage"
        onCreateClick={() => {}}
        onSetDefault={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /New rubric/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Set as default/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Delete rubric/i })).toBeNull();
  });
});
