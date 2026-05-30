import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RubricSection } from "./rubric-section";

describe("RubricSection", () => {
  it("renders title, optional letter, and count chip", () => {
    render(
      <RubricSection sectionKey="A" title="Project Scope" count={5}>
        <div>body</div>
      </RubricSection>,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Project Scope")).toBeInTheDocument();
    expect(screen.getByText(/5 items?/i)).toBeInTheDocument();
  });

  it("toggles open/closed on click and sets aria-expanded", async () => {
    const user = userEvent.setup();
    render(
      <RubricSection title="Test" count={1} defaultOpen={false}>
        <div data-testid="body">body</div>
      </RubricSection>,
    );
    const trigger = screen.getByRole("button", { name: /Test/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("body")).not.toBeVisible();
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("body")).toBeVisible();
  });

  it("starts open when defaultOpen is true", () => {
    render(
      <RubricSection title="Test" count={1} defaultOpen>
        <div data-testid="body">body</div>
      </RubricSection>,
    );
    expect(screen.getByRole("button", { name: /Test/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
