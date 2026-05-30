import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VersionHistoryPanel } from "./version-history-panel";

const v = [
  { id: "v003", createdAt: "2026-05-17T00:00:00Z", source: "edit", note: "latest" },
  { id: "v002", createdAt: "2026-05-16T00:00:00Z", source: "upload", note: "uploaded JSON" },
  { id: "v001", createdAt: "2026-05-15T00:00:00Z", source: "seed" },
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes("/versions") && (!init || init.method === undefined)) {
        return new Response(JSON.stringify({ versions: v }), { status: 200 });
      }
      if (init?.method === "POST" && url.includes("/restore")) {
        return new Response(JSON.stringify({ ok: true, newVersionId: "v004" }), { status: 200 });
      }
      if (init?.method === "DELETE") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response("{}", { status: 200 });
    }),
  );
  // Stub window.confirm so handleDelete proceeds without blocking
  vi.stubGlobal("confirm", () => true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VersionHistoryPanel", () => {
  it("lists versions newest-first with source chips", async () => {
    render(<VersionHistoryPanel usecaseId="cmgc-pde" rubricId="default" onChanged={() => {}} />);
    await waitFor(() => expect(screen.getByText("v003")).toBeTruthy());
    expect(screen.getByText("v002")).toBeTruthy();
    expect(screen.getByText("v001")).toBeTruthy();
    expect(screen.getByText("current")).toBeTruthy();
  });

  it("disables Restore and Delete on the newest version", async () => {
    render(<VersionHistoryPanel usecaseId="cmgc-pde" rubricId="default" onChanged={() => {}} />);
    await waitFor(() => expect(screen.getByText("v003")).toBeTruthy());
    const newestRow = screen.getByText("v003").closest("li")!;
    const restoreBtn = newestRow.querySelector("button:nth-of-type(1)") as HTMLButtonElement;
    const deleteBtn = newestRow.querySelector("button:nth-of-type(2)") as HTMLButtonElement;
    expect(restoreBtn.disabled).toBe(true);
    expect(deleteBtn.disabled).toBe(true);
  });

  it("calls onChanged after a successful restore", async () => {
    const onChanged = vi.fn();
    render(<VersionHistoryPanel usecaseId="cmgc-pde" rubricId="default" onChanged={onChanged} />);
    await waitFor(() => expect(screen.getByText("v002")).toBeTruthy());
    const row = screen.getByText("v002").closest("li")!;
    const restoreBtn = row.querySelector("button:nth-of-type(1)") as HTMLButtonElement;
    fireEvent.click(restoreBtn);
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});
