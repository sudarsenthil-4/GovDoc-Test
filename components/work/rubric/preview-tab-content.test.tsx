import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PreviewTabContent } from "./preview-tab-content";

const rubrics = [
  { id: "default", label: "Default", isDefault: true, createdAt: "2026-05-14T00:00:00Z" },
  { id: "pilot", label: "DBE Pilot", isDefault: false, createdAt: "2026-05-14T00:00:00Z" },
] as const;

function FakeView({
  data,
  headerRight,
}: {
  data: { v: string };
  headerRight?: React.ReactNode;
}) {
  return (
    <div>
      {headerRight}
      <div data-testid="view">{data.v}</div>
    </div>
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.includes("rubric=pilot")) {
        return new Response(JSON.stringify({ v: "pilot-content" }), { status: 200 });
      }
      return new Response(JSON.stringify({ v: "unexpected" }), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PreviewTabContent", () => {
  it("renders the initial data without an API call", () => {
    render(
      <PreviewTabContent
        usecaseId="cmgc-pde"
        rubrics={rubrics}
        initialData={{ v: "initial-default" }}
        View={FakeView}
      />,
    );
    expect(screen.getByTestId("view").textContent).toBe("initial-default");
    expect((globalThis.fetch as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(
      0,
    );
  });

  it("refetches the selected rubric's content and re-renders on selection change", async () => {
    render(
      <PreviewTabContent
        usecaseId="cmgc-pde"
        rubrics={rubrics}
        initialData={{ v: "initial-default" }}
        View={FakeView}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Default/i }));
    fireEvent.click(screen.getByRole("option", { name: /DBE Pilot/i }));
    await waitFor(() => {
      expect(screen.getByTestId("view").textContent).toBe("pilot-content");
    });
  });
});
