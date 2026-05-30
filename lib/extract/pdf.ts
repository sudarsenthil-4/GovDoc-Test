import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
// @ts-expect-error – no type declarations for the worker bundle
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

// Mirror lib/usecases/row-appraisal/vision/render-pdf.ts so both text extraction
// (here) and PDF→PNG rendering (there) use the same pdfjs version. Without this,
// pdf-parse used to ship a transitive pdfjs that mismatched ROW's worker version
// and crashed CUCP whenever ROW had warmed the same Cloud Run instance.
(globalThis as Record<string, unknown>).pdfjsWorker = pdfjsWorker;

type PdfTextItem = { str?: string };

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => (item as PdfTextItem).str ?? "")
        .join(" ")
        .trim(),
    );
  }
  return pages.join("\n\n");
}
