import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InputsForm } from "./inputs-form";
import { usePipelineStore } from "@/store/use-pipeline";

beforeEach(() => {
  usePipelineStore.setState({ current: null });
});

describe("InputsForm", () => {
  it("renders the CMGC inputs", () => {
    render(<InputsForm />);
    expect(screen.getByLabelText(/fact sheet/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /run evaluation/i })).toBeDefined();
  });

  it("renders the Reviewer role radios with friendly labels", () => {
    render(<InputsForm />);
    expect(screen.getByLabelText(/^Review project$/)).toBeDefined();
    expect(screen.getByLabelText(/Human-in-the-Feedback Loop/i)).toBeDefined();
  });

  it("calls usePipelineStore.start with cmgc-pde and FormData on submit", async () => {
    const startSpy = vi.fn(async () => {});
    usePipelineStore.setState({ start: startSpy as never });
    render(<InputsForm />);
    const file = new File(["fake docx"], "test.docx");
    const factInput = screen.getByLabelText(/fact sheet/i) as HTMLInputElement;
    Object.defineProperty(factInput, "files", { value: [file], writable: false });
    fireEvent.change(factInput);

    // Select Review project role so the form is submittable
    fireEvent.click(screen.getByLabelText(/^Review project$/));

    const form = factInput.closest("form")!;
    fireEvent.submit(form);

    await new Promise((r) => setTimeout(r, 0));
    expect(startSpy).toHaveBeenCalledOnce();
    const [useCaseId, fd] = startSpy.mock.calls[0]! as unknown as [string, FormData];
    expect(useCaseId).toBe("cmgc-pde");
    expect(fd).toBeInstanceOf(FormData);
    expect(fd.get("role")).toBe("district");
  });

});
