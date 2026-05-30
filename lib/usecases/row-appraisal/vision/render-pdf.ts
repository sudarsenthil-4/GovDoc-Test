import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
// @ts-expect-error – no type declarations for the worker bundle
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

// Run pdfjs in-process with no spawned worker thread.
// Setting globalThis.pdfjsWorker makes pdfjs use the already-imported
// WorkerMessageHandler instead of dynamically importing workerSrc at runtime.
// This is safe for Cloud Run standalone bundles because the worker module is
// now a static import and will be included in Next.js output file tracing.
(globalThis as any).pdfjsWorker = pdfjsWorker;

export async function renderPdfPagesAsImages(
  pdfBytes: Buffer,
  pageRange: [number, number],
  dpi = 150,
): Promise<string[]> {
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) });
  const doc = await loadingTask.promise;
  const total = doc.numPages;
  const start = Math.max(1, pageRange[0]);
  const end = Math.min(total, pageRange[1]);
  const scale = dpi / 72;

  const urls: string[] = [];
  try {
    for (let n = start; n <= end; n++) {
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext("2d");
      // pdfjs v5 types expect HTMLCanvasElement; @napi-rs/canvas is compatible at runtime.
      // canvasContext-only call: pdfjs derives canvas from ctx.canvas internally.
      await page.render({ canvasContext: ctx, viewport } as any).promise;
      const pngBuffer = canvas.toBuffer("image/png");
      urls.push(`data:image/png;base64,${pngBuffer.toString("base64")}`);
    }
    return urls;
  } finally {
    await doc.cleanup();
  }
}
