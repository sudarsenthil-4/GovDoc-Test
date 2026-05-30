import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreviewRubricTabs } from "@/components/work/rubric/preview-tabs";
import { defaultCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { defaultCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { defaultRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";

describe("PreviewRubricTabs", () => {
  const defaultManifest = [
    {
      id: "default",
      label: "Default",
      isDefault: true,
      createdAt: "2026-05-14T00:00:00.000Z",
    },
  ];
  function renderTabs() {
    return render(
      <PreviewRubricTabs
        cmgc={defaultCmgcRubric()}
        cucp={defaultCucpRubric()}
        row={defaultRowRubric()}
        cmgcRubrics={defaultManifest}
        cucpRubrics={defaultManifest}
        rowRubrics={defaultManifest}
      />,
    );
  }

  it("renders a tab for each of the 3 use cases", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: /Validate Project/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Validate Narrative/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Validate Appraisal/i })).toBeInTheDocument();
  });

  it("defaults to Validate Project and switches to Validate Narrative on click", async () => {
    const user = userEvent.setup();
    renderTabs();
    // Validate Project description renders on first paint.
    expect(screen.getByText(/Validate Project rubric/i)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /Validate Narrative/i }));
    // After switching, the Validate Narrative's two top-level sections are visible.
    expect(
      screen.getByRole("button", { name: /Mandatory Eligibility Requirements/i }),
    ).toBeInTheDocument();
  });
});
