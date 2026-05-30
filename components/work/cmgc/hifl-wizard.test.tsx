import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HiflWizard, type HiflOverrideEntry } from "./hifl-wizard";
import type { OverrideCardQuestion } from "./override-card";

function makeQuestion(id: string, overrides: Partial<OverrideCardQuestion> = {}): OverrideCardQuestion {
  return {
    question_id: id,
    question_text: `Question ${id}`,
    ai_rating: "B",
    confidence: 0.8,
    source_reasoning: "AI evidence",
    options: { A: "alpha", B: "bravo", C: "charlie" },
    ...overrides,
  };
}

describe("HiflWizard", () => {
  const baseProps = {
    questions: [makeQuestion("A1"), makeQuestion("A2")],
    recommendationLabel: "DBB",
    overrides: [] as HiflOverrideEntry[],
    onSaveOverride: () => {},
    onRemoveOverride: () => {},
  };

  it("starts on Step 1 (Review & Override)", () => {
    render(<HiflWizard {...baseProps} />);
    expect(screen.getByRole("button", { name: /Save & Continue/i })).toBeTruthy();
  });

  it("Save & Continue is always enabled (with or without overrides)", () => {
    render(<HiflWizard {...baseProps} />);
    expect(screen.getByRole("button", { name: /Save & Continue/i })).toBeEnabled();
  });

  it("does not render the legacy 'no changes needed' acknowledge button", () => {
    render(<HiflWizard {...baseProps} />);
    expect(screen.queryByRole("button", { name: /no changes needed/i })).toBeNull();
  });

  it("Back from Export returns to Review with overrides preserved", () => {
    const { rerender } = render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Save & Continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /← Back/i }));
    rerender(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    expect(screen.getAllByText(/A1/).length).toBeGreaterThan(0);
  });

  it("Save & Continue reveals the Export recap", () => {
    render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Save & Continue/i }));
    expect(screen.getByText(/Review complete/i)).toBeTruthy();
    expect(screen.getByText(/Final recommendation/i)).toBeTruthy();
  });

  it("renders the markdown summary report on the Export step when provided", () => {
    render(
      <HiflWizard
        {...baseProps}
        markdownReport={"# Project Delivery Evaluation\n\n**Recommended method:** CM/GC"}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Save & Continue/i }));
    expect(screen.getByText(/Project Delivery Evaluation/i)).toBeTruthy();
  });

  it("renders the live preview table inside the Review step when provided", () => {
    render(
      <HiflWizard
        {...baseProps}
        previewTable={<div data-testid="live-preview">live-preview-content</div>}
      />
    );
    expect(screen.getByTestId("live-preview")).toBeTruthy();
    expect(screen.getByText(/Live preview/i)).toBeTruthy();
  });

  it("Back from Export now reads 'Back to Review'", () => {
    render(
      <HiflWizard
        {...baseProps}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Save & Continue/i }));
    expect(screen.getByRole("button", { name: /Back to Review/i })).toBeTruthy();
  });

  it("Pending Corrections shows current overrides with a Remove button", () => {
    const onRemove = vi.fn();
    render(
      <HiflWizard
        {...baseProps}
        onRemoveOverride={onRemove}
        overrides={[{ question_id: "A1", oldValue: "B", newValue: "A", reason: "needs deeper study yes" }]}
      />
    );
    expect(screen.getAllByText(/A1/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));
    expect(onRemove).toHaveBeenCalledWith("A1");
  });

  it("question filter 'Missing Info Only' narrows the list", () => {
    render(
      <HiflWizard
        {...baseProps}
        questions={[
          makeQuestion("A1", { confidence: 0.95, source_reasoning: "good evidence" }),
          makeQuestion("A2", { confidence: 0.4, source_reasoning: "" }),
        ]}
      />
    );
    fireEvent.click(screen.getByLabelText(/Missing Info Only/i));
    const select = screen.getByLabelText(/Select question/i) as HTMLSelectElement;
    const optionTexts = Array.from(select.options).map((o) => o.textContent ?? "");
    expect(optionTexts.some((t) => t.includes("A2"))).toBe(true);
    expect(optionTexts.some((t) => t.includes("A1"))).toBe(false);
  });

  it("renders Live preview section ABOVE the StepBar, Show filter, Select-question dropdown, and override card", () => {
    render(
      <HiflWizard
        questions={[makeQuestion("A1")]}
        recommendationLabel="CM/GC"
        overrides={[]}
        previewTable={<div data-testid="preview">PREVIEW</div>}
        onSaveOverride={() => {}}
        onRemoveOverride={() => {}}
      />,
    );
    const preview = screen.getByTestId("preview");
    const livePreviewHeader = screen.getByRole("heading", { name: /Live preview/i });
    const stepBarReview = screen.getByRole("button", { name: /Review & Override/i });
    const filter = screen.getByText(/^Show:$/i);
    const dropdown = screen.getByLabelText(/Select question/i);
    const card = screen.getByLabelText(/Your Rating Override/i);
    expect(livePreviewHeader).toBeInTheDocument();
    // DOCUMENT_POSITION_FOLLOWING (4) means the second node follows the first.
    expect(preview.compareDocumentPosition(stepBarReview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(preview.compareDocumentPosition(filter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(preview.compareDocumentPosition(dropdown) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(preview.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders the Preview rubric slide-down when a rubric preview is provided", () => {
    render(
      <HiflWizard
        questions={[makeQuestion("A1")]}
        recommendationLabel="CM/GC"
        overrides={[]}
        previewTable={<div data-testid="preview">PREVIEW</div>}
        rubricPreview={<div data-testid="rubric">RUBRIC</div>}
        onSaveOverride={() => {}}
        onRemoveOverride={() => {}}
      />,
    );
    expect(screen.getByText(/Preview rubric/i)).toBeInTheDocument();
    expect(screen.getByTestId("rubric")).toBeInTheDocument();
  });
});
