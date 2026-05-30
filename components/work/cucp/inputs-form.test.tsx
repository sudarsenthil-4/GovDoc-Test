import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InputsForm } from "./inputs-form";
import { usePipelineStore } from "@/store/use-pipeline";

beforeEach(() => {
  usePipelineStore.setState({ current: null });
});

describe("CUCP InputsForm", () => {
  it("renders narrative and revenues inputs", () => {
    render(<InputsForm />);
    expect(screen.getByLabelText(/personal narrative/i)).toBeDefined();
    expect(screen.getByLabelText(/firm revenues/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /run re-evaluation/i })).toBeDefined();
  });

  it("does not render a Project ID text input (derived from filename)", () => {
    render(<InputsForm />);
    expect(screen.queryByLabelText(/Project ID/i)).toBeNull();
  });

  it("calls usePipelineStore.start with cucp-reevals on submit", async () => {
    const startSpy = vi.fn(async () => {});
    usePipelineStore.setState({ start: startSpy as never });
    render(<InputsForm />);
    const file = new File(["pdf-bytes"], "narrative.pdf");
    const narrativeInput = screen.getByLabelText(/personal narrative/i) as HTMLInputElement;
    Object.defineProperty(narrativeInput, "files", { value: [file], writable: false });
    fireEvent.change(narrativeInput);

    const form = narrativeInput.closest("form")!;
    fireEvent.submit(form);

    await new Promise((r) => setTimeout(r, 0));
    expect(startSpy).toHaveBeenCalledOnce();
    const args = startSpy.mock.calls[0] as unknown as [string, FormData];
    expect(args[0]).toBe("cucp-reevals");
    expect(args[1]).toBeInstanceOf(FormData);
  });

});
