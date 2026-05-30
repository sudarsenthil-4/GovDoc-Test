// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  __setRubricStoreRootForTests,
  loadSavedRubric,
  saveRubric,
  deleteRubric,
} from "./rubric-store";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "rubric-store-"));
  __setRubricStoreRootForTests(root);
});

afterEach(() => {
  __setRubricStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

describe("rubric-store", () => {
  it("returns null when no rubric is saved", async () => {
    expect(await loadSavedRubric("cmgc-pde")).toBeNull();
  });

  it("round-trips a saved rubric", async () => {
    const data = { questions: [{ id: "A1", section: "A", question: "q", option_a: "a", option_b: "b", option_c: "c" }] };
    await saveRubric("cmgc-pde", data);
    expect(await loadSavedRubric("cmgc-pde")).toEqual(data);
  });

  it("delete removes the saved rubric", async () => {
    await saveRubric("row-appraisal", { x: 1 });
    await deleteRubric("row-appraisal");
    expect(await loadSavedRubric("row-appraisal")).toBeNull();
  });

  it("rejects unknown use case ids", async () => {
    await expect(saveRubric("not-a-thing", {})).rejects.toThrow(/Unknown rubric use case/);
  });

  it("rejects path-traversal ids", async () => {
    await expect(saveRubric("../etc/passwd", {})).rejects.toThrow();
  });
});
