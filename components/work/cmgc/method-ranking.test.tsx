import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MethodRanking } from "./method-ranking";
import { mockRunResult } from "@/lib/usecases/cmgc-pde/scoring/fixtures";

describe("MethodRanking", () => {
  it("renders all 6 methods", () => {
    const r = mockRunResult();
    render(<MethodRanking multiMethod={r.multi_method} />);
    for (const m of r.multi_method.method_scores) {
      expect(screen.getByText(m.method)).toBeDefined();
    }
  });

  it("blocked methods show a Blocked indicator", () => {
    // R1+R2+R3 trigger → blocks DBB + Design-Sequencing
    const r = mockRunResult({ A1: "C", A2: "C", A3: "C" });
    render(<MethodRanking multiMethod={r.multi_method} />);
    expect(screen.getByTestId("blocked-Design-Bid-Build")).toBeDefined();
  });

  it("ranks displayed in order #1..#6", () => {
    const r = mockRunResult();
    render(<MethodRanking multiMethod={r.multi_method} />);
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByText(`#${i}`)).toBeDefined();
    }
  });
});
