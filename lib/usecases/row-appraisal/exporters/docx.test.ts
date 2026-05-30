import { describe, it, expect } from "vitest";
import { buildEvaluationDocx, docxExporter } from "./docx";
import type { RowRunResult } from "@/lib/usecases/row-appraisal/types";

function makeResult(): RowRunResult {
  return {
    pdf_filename: "test.pdf",
    markdown_asset: "test.md",
    evaluation_results: Array.from({ length: 34 }, (_, i) => ({
      category: `Category ${i + 1}`,
      score: i === 0 ? -1 : 3,
      criteria_met: `Criteria met for ${i + 1}`,
      evidence: `Evidence for ${i + 1}`,
      status: "✅ Pass" as const,
      comments: `Comments for ${i + 1}`,
    })),
    markdown_table: "",
    evaluation_date: "2026-05-06",
  };
}

describe("buildEvaluationDocx (ROW)", () => {
  it("produces a non-empty Buffer", async () => {
    const buf = await buildEvaluationDocx(makeResult());
    expect(buf.byteLength).toBeGreaterThan(100);
  });

  it("output starts with ZIP magic bytes (DOCX = ZIP)", async () => {
    const buf = await buildEvaluationDocx(makeResult());
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it("exposes canonical Exporter contract fields", () => {
    expect(docxExporter.id).toBe("docx");
    expect(docxExporter.label).toBe("Download as Word");
    expect(docxExporter.contentType).toContain("wordprocessingml");
  });
});
