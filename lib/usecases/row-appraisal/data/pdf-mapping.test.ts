import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { resolve } from "path";
import { LANDING_AI_PDF_MAPPING, DEFAULT_MARKDOWN_ASSET } from "./pdf-mapping";

describe("LANDING_AI_PDF_MAPPING", () => {
  it("every value is a real file in the assets directory", () => {
    const assetsDir = resolve(process.cwd(), "lib/usecases/row-appraisal/assets");
    const values = new Set(Object.values(LANDING_AI_PDF_MAPPING));
    for (const filename of values) {
      const fullPath = resolve(assetsDir, filename);
      expect(existsSync(fullPath), `asset file not found: ${fullPath}`).toBe(true);
    }
  });

  it("DEFAULT_MARKDOWN_ASSET is a real file in the assets directory", () => {
    const fullPath = resolve(process.cwd(), "lib/usecases/row-appraisal/assets", DEFAULT_MARKDOWN_ASSET);
    expect(existsSync(fullPath)).toBe(true);
  });
});
