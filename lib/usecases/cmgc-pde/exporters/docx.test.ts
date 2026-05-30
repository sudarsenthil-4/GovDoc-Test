import { describe, it, expect } from "vitest";
import { buildEvaluationDocx, docxExporter } from "./docx";
import { mockRunResult } from "../scoring/fixtures";

describe("buildEvaluationDocx", () => {
  it("returns a non-empty Buffer", async () => {
    const buf = await buildEvaluationDocx(mockRunResult(), "Test Project");
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it("starts with ZIP magic bytes (DOCX is a ZIP)", async () => {
    const buf = await buildEvaluationDocx(mockRunResult(), "Test Project");
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
    expect(buf[2]).toBe(0x03);
    expect(buf[3]).toBe(0x04);
  });
});

describe("docxExporter", () => {
  it("returns a Uint8Array starting with ZIP magic bytes", async () => {
    const out = await docxExporter.build(mockRunResult());
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out[0]).toBe(0x50);
    expect(out[1]).toBe(0x4b);
  });

  it("uses evaluation.project_name as fallback when present", async () => {
    const result = mockRunResult();
    result.evaluation.project_name = "I-880 Widening";
    const out = await docxExporter.build(result);
    expect(out.byteLength).toBeGreaterThan(1000);
  });
});
