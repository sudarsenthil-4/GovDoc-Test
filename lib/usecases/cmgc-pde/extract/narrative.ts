import mammoth from "mammoth";
import { extractTextFromPdf } from "@/lib/extract/pdf";

const STOP_KEYWORDS = [
  "Project Risk Assessment",
  "Construction Manager Tasks",
  "Glossary of Preconstruction",
  "District Single Point Signature",
];

export async function extractNarrativeFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  const lines: string[] = [];
  for (const raw of value.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (STOP_KEYWORDS.some((kw) => line.toLowerCase().includes(kw.toLowerCase()))) break;
    lines.push(line);
  }
  return lines.join("\n");
}

export async function extractMultiDocContext(
  files: { name: string; buffer: Buffer }[],
): Promise<string> {
  const parts: string[] = [];
  for (const { name, buffer } of files) {
    const lower = name.toLowerCase();
    let content: string;
    try {
      if (lower.endsWith(".docx")) content = await extractNarrativeFromDocx(buffer);
      else if (lower.endsWith(".pdf")) content = await extractTextFromPdf(buffer);
      else content = "UNSUPPORTED FILE TYPE";
    } catch (e) {
      content = `ERROR EXTRACTING: ${e instanceof Error ? e.message : String(e)}`;
    }
    parts.push(`<source_document name="${name}">\n${content}\n</source_document>`);
  }
  return parts.join("\n\n");
}

export { extractTextFromPdf } from "@/lib/extract/pdf";
