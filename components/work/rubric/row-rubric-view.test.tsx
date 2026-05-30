import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RowRubricView } from "./row-rubric-view";
import rubricSchema from "@/lib/usecases/row-appraisal/assets/rubric_schema.json";

describe("RowRubricView", () => {
  it("renders a section per category in the schema", () => {
    render(<RowRubricView />);
    const categories = Object.keys(rubricSchema as Record<string, unknown>);
    for (const cat of categories) {
      expect(screen.getByText(cat)).toBeInTheDocument();
    }
  });

  it("expanding 'Title Page' shows tier-4 cell as em-dash (empty in schema)", async () => {
    const user = userEvent.setup();
    render(<RowRubricView />);
    const titleButton = screen.getByRole("button", { name: /Title Page/i });
    await user.click(titleButton);
    // Tier 4 of "Title Page" is "" in the schema; it must render as "—".
    const dashCells = screen.getAllByText("—");
    expect(dashCells.length).toBeGreaterThanOrEqual(1);
  });
});
