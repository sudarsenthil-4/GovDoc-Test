import { describe, it, expect, beforeAll } from "vitest";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { renderPdfPagesAsImages } from "./render-pdf";

let pdfBytes: Buffer;

beforeAll(async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(`Page ${i}`, { x: 50, y: 700, size: 24, font, color: rgb(0, 0, 0) });
  }
  pdfBytes = Buffer.from(await doc.save());
});

describe("renderPdfPagesAsImages", () => {
  it("returns base64 data URLs for the requested page range", async () => {
    const urls = await renderPdfPagesAsImages(pdfBytes, [1, 2], 150);
    expect(urls.length).toBe(2);
    expect(urls[0]).toMatch(/^data:image\/png;base64,/);
    expect(urls[0]!.length).toBeGreaterThan(200);
  });

  it("clamps page range to actual document length", async () => {
    const urls = await renderPdfPagesAsImages(pdfBytes, [1, 9999], 100);
    expect(urls.length).toBe(3);
  });

  it("respects start clamping to 1 when start < 1", async () => {
    const urls = await renderPdfPagesAsImages(pdfBytes, [0, 1], 100);
    expect(urls.length).toBe(1);
  });
});
