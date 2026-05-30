// @vitest-environment node
import { describe, it, expect } from "vitest";
import { hashPrompt } from "./hash-prompt";

describe("hashPrompt", () => {
  it("is stable across whitespace differences", () => {
    const a = hashPrompt([{ role: "user", content: "hello world" }]);
    const b = hashPrompt([{ role: "user", content: "hello   world" }]);
    expect(a).toBe(b);
  });
  it("differs across content changes", () => {
    const a = hashPrompt([{ role: "user", content: "hello" }]);
    const b = hashPrompt([{ role: "user", content: "goodbye" }]);
    expect(a).not.toBe(b);
  });
});
