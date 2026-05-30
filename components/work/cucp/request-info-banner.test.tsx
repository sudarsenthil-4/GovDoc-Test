import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RequestInfoBanner } from "./request-info-banner";

describe("RequestInfoBanner", () => {
  it("renders nothing when show=false", () => {
    const { container } = render(<RequestInfoBanner show={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the verbatim caltrans copy when show=true", () => {
    render(<RequestInfoBanner show={true} />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeTruthy();
    expect(alert.textContent).toMatch(
      /Final decision: Not eligible at this time \(pending additional information\)/,
    );
  });
});
