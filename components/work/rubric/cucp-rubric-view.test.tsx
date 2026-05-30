import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CucpRubricView } from "./cucp-rubric-view";
import { CUCP_L3_CRITERIA } from "@/lib/usecases/cucp-reevals/rubric";

describe("CucpRubricView", () => {
  it("renders the Mandatory Eligibility section using PDF-style headings", () => {
    render(<CucpRubricView />);
    const mandatory = CUCP_L3_CRITERIA.filter((c) => c.s_no <= 3);
    for (const c of mandatory) {
      expect(screen.getByText(c.title ?? c.name)).toBeInTheDocument();
    }
  });

  it("renders the Scored Evaluation Criteria with YES/NO definitions", () => {
    render(<CucpRubricView />);
    const evaluation = CUCP_L3_CRITERIA.filter((c) => c.s_no >= 4);
    for (const c of evaluation) {
      expect(screen.getByText(c.title ?? c.name)).toBeInTheDocument();
      if (c.pass) expect(screen.getByText(c.pass)).toBeInTheDocument();
      if (c.fail) expect(screen.getByText(c.fail)).toBeInTheDocument();
    }
  });
});
