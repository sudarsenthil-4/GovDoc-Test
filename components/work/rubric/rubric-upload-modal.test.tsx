import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RubricUploadModal } from "./rubric-upload-modal";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ ok: true, rubricId: "default", versionId: "v003" }), {
        status: 200,
      }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RubricUploadModal", () => {
  it("uploads a new-version when a file is picked and submit pressed", async () => {
    const onUploaded = vi.fn();
    render(
      <RubricUploadModal
        open
        usecaseId="cmgc-pde"
        rubricId="default"
        onUploaded={onUploaded}
        onClose={() => {}}
      />,
    );
    const file = new File(["{}"], "rubric.json", { type: "application/json" });
    const input = screen.getByLabelText(/file/i) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /upload/i }));
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith({ rubricId: "default", versionId: "v003" }));
  });

  it("surfaces a 4xx server error without crashing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }),
      ),
    );
    render(
      <RubricUploadModal
        open
        usecaseId="cmgc-pde"
        rubricId="default"
        onUploaded={() => {}}
        onClose={() => {}}
      />,
    );
    const file = new File(["x"], "rubric.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText(/file/i) as HTMLInputElement, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /upload/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Invalid JSON/));
  });

  it("submit disabled until a file is selected", () => {
    render(
      <RubricUploadModal
        open
        usecaseId="cmgc-pde"
        rubricId="default"
        onUploaded={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /upload/i })).toBeDisabled();
  });
});
