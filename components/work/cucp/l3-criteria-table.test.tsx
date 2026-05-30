import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { L3CriteriaTable } from "./l3-criteria-table";
import type { Criterion } from "@/lib/usecases/cucp-reevals/types";

const passCriterion: Criterion = {
  s_no: 1,
  category: "Owner Disadvantage",
  qualification: "Socially and economically disadvantaged",
  rule_requires: "49 CFR §26.67(a)(1)",
  evidence_summary: "Owner is a member of a presumptively disadvantaged group.",
  reasoning: "Affidavit on file confirms group membership.",
  pass_fail: "Pass",
  request_info: "No",
  confidence: 0.92,
};

const failCriterion: Criterion = {
  s_no: 2,
  category: "Personal Net Worth",
  qualification: "PNW under cap",
  rule_requires: "49 CFR §26.67(b)",
  evidence_summary: "Owner PNW exceeds the $1.32M cap.",
  reasoning: "Statement shows $1.5M net worth.",
  pass_fail: "Fail",
  request_info: "No",
  confidence: 0.88,
};

const infoCriterion: Criterion = {
  s_no: 3,
  category: "Control",
  qualification: "Day-to-day control",
  rule_requires: "49 CFR §26.71",
  evidence_summary: "Bylaws unclear on day-to-day operations.",
  reasoning: "Need additional documentation.",
  pass_fail: "Pass",
  request_info: "Yes",
  confidence: 0.55,
};

const lowConfCriterion: Criterion = {
  ...failCriterion,
  s_no: 4,
  confidence: 0.32,
};

describe("L3CriteriaTable", () => {
  it("renders the 7 caltrans column headers verbatim", () => {
    render(<L3CriteriaTable criteria={[passCriterion]} />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual([
      "Category",
      "Criterion",
      "Evidence Summary",
      "AI Reasoning",
      "Pass/Fail",
      "Need More Info?",
      "Confidence",
    ]);
  });

  it("renders one row per criterion", () => {
    render(<L3CriteriaTable criteria={[passCriterion, failCriterion]} />);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3); // header + 2
  });

  it("displays Category and Criterion (qualification) in separate columns", () => {
    render(<L3CriteriaTable criteria={[passCriterion]} />);
    const dataRow = screen.getAllByRole("row")[1]!;
    const cells = within(dataRow).getAllByRole("cell");
    expect(cells[0]!.textContent).toBe("Owner Disadvantage");
    expect(cells[1]!.textContent).toBe("Socially and economically disadvantaged");
  });

  it("displays Evidence Summary and AI Reasoning in separate columns", () => {
    render(<L3CriteriaTable criteria={[passCriterion]} />);
    const cells = within(screen.getAllByRole("row")[1]!).getAllByRole("cell");
    expect(cells[2]!.textContent).toBe(
      "Owner is a member of a presumptively disadvantaged group.",
    );
    expect(cells[3]!.textContent).toBe(
      "Affidavit on file confirms group membership.",
    );
  });

  it("colors Pass cell with theme card surface (primary accent on border)", () => {
    const { container } = render(<L3CriteriaTable criteria={[passCriterion]} />);
    const verdictCell = container.querySelector("td[data-verdict='pass']");
    expect(verdictCell).not.toBeNull();
    expect(verdictCell!.className).toMatch(/bg-card/);
  });

  it("colors Fail cell with the destructive theme tint", () => {
    const { container } = render(<L3CriteriaTable criteria={[failCriterion]} />);
    const verdictCell = container.querySelector("td[data-verdict='fail']");
    expect(verdictCell).not.toBeNull();
    expect(verdictCell!.className).toMatch(/bg-destructive\/5/);
  });

  it("colors verdict cell with the Warning theme tone when request_info=Yes (overrides Pass/Fail)", () => {
    const { container } = render(<L3CriteriaTable criteria={[infoCriterion]} />);
    const verdictCell = container.querySelector("td[data-verdict='warning']");
    expect(verdictCell).not.toBeNull();
    expect(verdictCell!.className).toMatch(/bg-card/);
  });

  it("renders 'Need More Info?' as Yes/No and tints Yes with the Warning theme tone", () => {
    const { container } = render(
      <L3CriteriaTable criteria={[passCriterion, infoCriterion]} />,
    );
    const noCell = container.querySelector("td[data-request-info='no']");
    const yesCell = container.querySelector("td[data-request-info='yes']");
    expect(noCell?.textContent).toBe("No");
    expect(yesCell?.textContent).toBe("Yes");
    expect(yesCell!.className).toMatch(/bg-card/);
  });

  it("colors Confidence cells by tone (Pass primary, Warning muted, Fail destructive)", () => {
    const { container } = render(
      <L3CriteriaTable criteria={[passCriterion, infoCriterion, lowConfCriterion]} />,
    );
    const cells = container.querySelectorAll("td[data-confidence-tone]");
    expect(cells[0]!.getAttribute("data-confidence-tone")).toBe("pass");
    expect(cells[0]!.className).toMatch(/bg-card/);
    expect(cells[1]!.getAttribute("data-confidence-tone")).toBe("warning");
    expect(cells[1]!.className).toMatch(/bg-card/);
    expect(cells[2]!.getAttribute("data-confidence-tone")).toBe("fail");
    expect(cells[2]!.className).toMatch(/bg-destructive\/5/);
  });

  it("when overrideMap provides a new verdict, displays the override verdict and reason", () => {
    render(
      <L3CriteriaTable
        criteria={[passCriterion]}
        overrideMap={{
          "1": {
            verdict: "Fail",
            request_info: "No",
            reason: "Affidavit was incomplete on review.",
          },
        }}
      />,
    );
    expect(screen.getByText("Fail")).toBeTruthy();
    expect(screen.getByText("Affidavit was incomplete on review.")).toBeTruthy();
  });

  it("when overrideMap sets verdict to 'Request Additional Information', uses warning tone", () => {
    const { container } = render(
      <L3CriteriaTable
        criteria={[passCriterion]}
        overrideMap={{
          "1": {
            verdict: "Request Additional Information",
            request_info: "Yes",
            reason: "Need updated tax records.",
          },
        }}
      />,
    );
    const verdictCell = container.querySelector("td[data-verdict='warning']");
    expect(verdictCell).not.toBeNull();
  });

  it("falls back to em-dash for blank Category / Criterion / Evidence / Reasoning", () => {
    const sparse: Criterion = {
      ...passCriterion,
      category: "",
      qualification: "",
      evidence_summary: "",
      reasoning: "",
    };
    render(<L3CriteriaTable criteria={[sparse]} />);
    const cells = within(screen.getAllByRole("row")[1]!).getAllByRole("cell");
    expect(cells[0]!.textContent).toBe("—");
    expect(cells[1]!.textContent).toBe("—");
    expect(cells[2]!.textContent).toBe("—");
    expect(cells[3]!.textContent).toBe("—");
  });
});
