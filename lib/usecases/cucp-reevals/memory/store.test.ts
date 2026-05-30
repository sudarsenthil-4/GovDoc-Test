import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadPrecedents,
  commitStagedPrecedents,
  deletePrecedent,
  __setStoreRootForTests,
} from "./store";
import type { PrecedentsByLevel } from "./precedents";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "cucp-precedents-test-"));
  __setStoreRootForTests(root);
});

afterEach(() => {
  __setStoreRootForTests(null);
  rmSync(root, { recursive: true, force: true });
});

const sample: PrecedentsByLevel = {
  level_1_precedents: [
    { target: "Narrative PNW", correction: "1500000", human_reasoning: "Round to nearest dollar" },
  ],
  level_2_precedents: [
    {
      target: "Lost contract due to underbidding",
      correction: "Ordinary Business Risk",
      human_reasoning: "Pricing competition is not a §26.67 disadvantage.",
      fact_id: "fact_3",
    },
  ],
  level_3_precedents: [
    {
      target: "Demonstration of Disadvantage",
      correction: "Fail",
      human_reasoning: "Affidavit lacks specific incidents.",
      s_no: 4,
    },
  ],
};

describe("precedents store", () => {
  it("returns empty precedents for an unknown project", async () => {
    const result = await loadPrecedents("project-x");
    expect(result.level_1_precedents).toEqual([]);
    expect(result.level_2_precedents).toEqual([]);
    expect(result.level_3_precedents).toEqual([]);
  });

  it("commits and reloads precedents round-trip", async () => {
    await commitStagedPrecedents("project-a", sample);
    const reloaded = await loadPrecedents("project-a");
    expect(reloaded.level_1_precedents).toHaveLength(1);
    expect(reloaded.level_2_precedents[0]?.fact_id).toBe("fact_3");
    expect(reloaded.level_3_precedents[0]?.s_no).toBe(4);
  });

  it("appends on subsequent commits (does not overwrite)", async () => {
    await commitStagedPrecedents("project-a", sample);
    await commitStagedPrecedents("project-a", {
      level_1_precedents: [],
      level_2_precedents: [
        { target: "second", correction: "Social Disadvantage", human_reasoning: "x".repeat(20), fact_id: "f9" },
      ],
      level_3_precedents: [],
    });
    const reloaded = await loadPrecedents("project-a");
    expect(reloaded.level_2_precedents).toHaveLength(2);
  });

  it("creates a timestamped backup before each commit (after the first)", async () => {
    await commitStagedPrecedents("project-a", sample);
    await commitStagedPrecedents("project-a", sample);
    const backups = readdirSync(join(root, "backups"));
    expect(backups.some((f) => f.startsWith("project-a-"))).toBe(true);
  });

  it("deletes a precedent at (level, index) and writes a backup", async () => {
    await commitStagedPrecedents("project-a", sample);
    await deletePrecedent("project-a", 2, 0);
    const reloaded = await loadPrecedents("project-a");
    expect(reloaded.level_2_precedents).toHaveLength(0);
    const backups = readdirSync(join(root, "backups"));
    expect(backups.length).toBeGreaterThanOrEqual(1);
  });

  it("returns unchanged on delete with out-of-range index (no error)", async () => {
    await commitStagedPrecedents("project-a", sample);
    await deletePrecedent("project-a", 1, 99);
    const reloaded = await loadPrecedents("project-a");
    expect(reloaded.level_1_precedents).toHaveLength(1);
  });

  it("isolates two project IDs", async () => {
    await commitStagedPrecedents("project-a", sample);
    const b = await loadPrecedents("project-b");
    expect(b.level_2_precedents).toHaveLength(0);
  });

  it("serializes concurrent commits for the same project", async () => {
    await Promise.all([
      commitStagedPrecedents("project-a", { ...sample, level_2_precedents: [] }),
      commitStagedPrecedents("project-a", sample),
      commitStagedPrecedents("project-a", { ...sample, level_3_precedents: [] }),
    ]);
    const reloaded = await loadPrecedents("project-a");
    expect(reloaded.level_1_precedents).toHaveLength(3);
  });

  it("rejects projectIds that contain path separators or traversal", async () => {
    await expect(commitStagedPrecedents("../secret", sample)).rejects.toThrow();
    await expect(loadPrecedents("a/b")).rejects.toThrow();
  });

  it("writes precedents file under the configured root", async () => {
    await commitStagedPrecedents("project-a", sample);
    expect(existsSync(join(root, "project-a.json"))).toBe(true);
    const contents = JSON.parse(readFileSync(join(root, "project-a.json"), "utf8"));
    expect(contents.level_1_precedents).toHaveLength(1);
  });
});
