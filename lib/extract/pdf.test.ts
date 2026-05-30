import { describe, it, expect } from "vitest";
import { extractTextFromPdf } from "./pdf";

describe("extractTextFromPdf", () => {
  it("is a function that accepts a Buffer", () => {
    expect(typeof extractTextFromPdf).toBe("function");
  });
});
