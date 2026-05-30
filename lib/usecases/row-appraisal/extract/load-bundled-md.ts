import { readFile } from "node:fs/promises";
import path from "node:path";
import { LANDING_AI_PDF_MAPPING, DEFAULT_MARKDOWN_ASSET } from "../data/pdf-mapping";
import { extractTextFromLandingAiMd } from "./landing-ai-md";

const ASSETS_DIR = path.resolve(process.cwd(), "lib/usecases/row-appraisal/assets");

export async function loadBundledMarkdownForFilename(pdfFilename: string): Promise<{
  asset: string;
  text: string;
} | null> {
  const asset = LANDING_AI_PDF_MAPPING[pdfFilename] ?? DEFAULT_MARKDOWN_ASSET;
  try {
    const raw = await readFile(path.join(ASSETS_DIR, asset), "utf8");
    return { asset, text: extractTextFromLandingAiMd(raw) };
  } catch {
    return null;
  }
}
