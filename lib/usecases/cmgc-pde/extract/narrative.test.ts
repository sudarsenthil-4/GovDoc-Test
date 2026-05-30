import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  extractNarrativeFromDocx,
  extractTextFromPdf,
  extractMultiDocContext,
} from "./narrative";

const FIXTURES_DIR = path.resolve(__dirname, "../../../../tests/fixtures/cmgc");
const TXT_FIXTURE = path.join(FIXTURES_DIR, "synthetic-narrative.txt");
const DOCX_FIXTURE = path.join(FIXTURES_DIR, "synthetic-narrative.docx");

beforeAll(async () => {
  // Build the .docx from the .txt fixture (idempotent)
  const text = readFileSync(TXT_FIXTURE, "utf8");
  const paragraphs = text.split(/\r?\n/).map(
    (line) => new Paragraph({ children: [new TextRun(line)] }),
  );
  const doc = new Document({ sections: [{ children: paragraphs }] });
  const buf = await Packer.toBuffer(doc);
  if (!existsSync(FIXTURES_DIR)) mkdirSync(FIXTURES_DIR, { recursive: true });
  writeFileSync(DOCX_FIXTURE, buf);
});

describe("extractNarrativeFromDocx", () => {
  it("returns plain text from a real DOCX", async () => {
    const buf = readFileSync(DOCX_FIXTURE);
    const text = await extractNarrativeFromDocx(buf);
    expect(text).toContain("$48.7 million");
    expect(text).toContain("BNSF");
  });

  it("stops at 'Project Risk Assessment' heading", async () => {
    const buf = readFileSync(DOCX_FIXTURE);
    const text = await extractNarrativeFromDocx(buf);
    expect(text).not.toContain("Project Risk Assessment");
  });
});

describe("extractTextFromPdf", () => {
  // Unit test deferred — integration test exercises this. Contract assertion only.
  it("is exported as a function", () => {
    expect(typeof extractTextFromPdf).toBe("function");
  });
});

describe("extractMultiDocContext", () => {
  it("wraps each file in <source_document name=...> tags", async () => {
    const docxBuf = readFileSync(DOCX_FIXTURE);
    const result = await extractMultiDocContext([
      { name: "synthetic-narrative.docx", buffer: docxBuf },
    ]);
    expect(result).toContain('<source_document name="synthetic-narrative.docx">');
    expect(result).toContain("</source_document>");
    expect(result).toContain("$48.7 million");
  });

  it("flags unsupported file types", async () => {
    const result = await extractMultiDocContext([
      { name: "weird.bin", buffer: Buffer.from("ignored") },
    ]);
    expect(result).toContain("UNSUPPORTED FILE TYPE");
  });

  it("captures extraction errors per file", async () => {
    const result = await extractMultiDocContext([
      { name: "broken.docx", buffer: Buffer.from("not really a docx") },
    ]);
    expect(result).toContain("ERROR EXTRACTING");
  });

  it("joins multiple files with double-newline separator", async () => {
    const docxBuf = readFileSync(DOCX_FIXTURE);
    const result = await extractMultiDocContext([
      { name: "a.docx", buffer: docxBuf },
      { name: "b.docx", buffer: docxBuf },
    ]);
    const occurrences = result.match(/<source_document name=/g);
    expect(occurrences).toHaveLength(2);
    expect(result).toContain("</source_document>\n\n<source_document name=");
  });
});
