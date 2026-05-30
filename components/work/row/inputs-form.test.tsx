import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InputsForm } from "./inputs-form";
import { usePipelineStore } from "@/store/use-pipeline";

beforeEach(() => {
  usePipelineStore.setState({ current: null });
});

describe("ROW InputsForm", () => {
  it("renders pdf input and submit button", () => {
    render(<InputsForm />);
    expect(screen.getByLabelText(/appraisal pdf/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /run evaluation/i })).toBeDefined();
  });

  it("does not surface any parcel/EA filenames in the upload UI", () => {
    render(<InputsForm />);
    expect(screen.queryByText(/Parcel_/i)).toBeNull();
    expect(screen.queryByText(/EA_?[0-9]/i)).toBeNull();
    expect(screen.queryByText(/Lee_Appraisal/i)).toBeNull();
    expect(screen.getByText(/bundled OCR for four sample appraisals/i)).toBeDefined();
  });

  it("calls usePipelineStore.start with row-appraisal on submit", async () => {
    const startSpy = vi.fn(async () => {});
    usePipelineStore.setState({ start: startSpy as never });
    render(<InputsForm />);

    const pdfInput = screen.getByLabelText(/appraisal pdf/i) as HTMLInputElement;
    const form = pdfInput.closest("form")!;
    fireEvent.submit(form);

    await new Promise((r) => setTimeout(r, 0));
    expect(startSpy).toHaveBeenCalledOnce();
    const args = startSpy.mock.calls[0] as unknown as [string, FormData];
    expect(args[0]).toBe("row-appraisal");
    expect(args[1]).toBeInstanceOf(FormData);
  });

});
