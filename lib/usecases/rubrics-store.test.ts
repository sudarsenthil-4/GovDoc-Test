import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  __setRubricsStoreRootForTests,
  listRubrics,
  loadRubric,
  saveRubric,
  createRubric,
  setDefaultRubric,
  deleteRubric,
  resetRubricContent,
  getDefaultRubricId,
  listVersions,
  deleteVersion,
} from "./rubrics-store";

let tmp = "";

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "rubrics-store-"));
  __setRubricsStoreRootForTests(tmp);
});

afterEach(() => {
  __setRubricsStoreRootForTests(null);
  rmSync(tmp, { recursive: true, force: true });
});

describe("rubrics-store", () => {
  it("initializes a fresh manifest with a single 'default' rubric", async () => {
    const list = await listRubrics("cmgc-pde");
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe("default");
    expect(list[0]!.isDefault).toBe(true);
  });

  it("migrates a legacy single-file rubric into the new directory layout", async () => {
    // Seed the legacy `data/rubrics/<usecase>.json` layout.
    const legacy = join(tmp, "cmgc-pde.json");
    writeFileSync(legacy, JSON.stringify({ questions: [], weights: {} }), "utf-8");

    // First call triggers migration.
    const list = await listRubrics("cmgc-pde");
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe("default");
    expect(existsSync(legacy)).toBe(false); // legacy file gone
    expect(existsSync(join(tmp, "cmgc-pde", "default.json"))).toBe(true);
    expect(existsSync(join(tmp, "cmgc-pde", "manifest.json"))).toBe(true);

    // Migrated content is loadable as the default rubric.
    const loaded = (await loadRubric("cmgc-pde")) as { questions: unknown[] };
    expect(loaded.questions).toEqual([]);
  });

  it("getDefaultRubricId returns the default entry id", async () => {
    expect(await getDefaultRubricId("cmgc-pde")).toBe("default");
  });

  it("saveRubric persists for a specific rubric id and updates updatedAt", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    const list = await listRubrics("cmgc-pde");
    expect(list[0]!.updatedAt).toBeTruthy();
    const loaded = await loadRubric("cmgc-pde", "default");
    expect(loaded).toEqual({ v: 1 });
  });

  it("rejects saveRubric for an unknown rubric id", async () => {
    await expect(saveRubric("cmgc-pde", "ghost", {})).rejects.toThrow(/Unknown rubric id/);
  });

  it("createRubric adds an entry; not default; clone-from copies content", async () => {
    await saveRubric("cmgc-pde", "default", { source: "default" });
    const created = await createRubric("cmgc-pde", {
      id: "pilot",
      label: "DBE Pilot",
      cloneFrom: "default",
    });
    expect(created.isDefault).toBe(false);
    const cloned = await loadRubric("cmgc-pde", "pilot");
    expect(cloned).toEqual({ source: "default" });
  });

  it("createRubric without cloneFrom leaves the new rubric loading null until saved", async () => {
    await createRubric("cmgc-pde", { id: "blank", label: "Blank" });
    expect(await loadRubric("cmgc-pde", "blank")).toBeNull();
  });

  it("createRubric rejects an id that already exists", async () => {
    await expect(
      createRubric("cmgc-pde", { id: "default", label: "Re-default" }),
    ).rejects.toThrow(/already exists/);
  });

  it("createRubric rejects an unsafe id", async () => {
    await expect(
      createRubric("cmgc-pde", { id: "../escape", label: "x" }),
    ).rejects.toThrow(/Invalid rubric id/);
  });

  it("setDefaultRubric switches the default flag", async () => {
    await createRubric("cmgc-pde", { id: "pilot", label: "Pilot" });
    await setDefaultRubric("cmgc-pde", "pilot");
    const list = await listRubrics("cmgc-pde");
    expect(list.find((r) => r.id === "pilot")!.isDefault).toBe(true);
    expect(list.find((r) => r.id === "default")!.isDefault).toBe(false);
    expect(await getDefaultRubricId("cmgc-pde")).toBe("pilot");
  });

  it("loadRubric (no id) follows the current default", async () => {
    await saveRubric("cmgc-pde", "default", { v: "old default" });
    await createRubric("cmgc-pde", { id: "pilot", label: "Pilot" });
    await saveRubric("cmgc-pde", "pilot", { v: "pilot" });
    await setDefaultRubric("cmgc-pde", "pilot");
    expect(await loadRubric("cmgc-pde")).toEqual({ v: "pilot" });
  });

  it("deleteRubric removes the entry + file when it isn't the default", async () => {
    await createRubric("cmgc-pde", { id: "pilot", label: "Pilot" });
    await saveRubric("cmgc-pde", "pilot", { v: 1 });
    await deleteRubric("cmgc-pde", "pilot");
    const list = await listRubrics("cmgc-pde");
    expect(list.some((r) => r.id === "pilot")).toBe(false);
    expect(existsSync(join(tmp, "cmgc-pde", "pilot.json"))).toBe(false);
  });

  it("deleteRubric refuses to delete the default", async () => {
    await expect(deleteRubric("cmgc-pde", "default")).rejects.toThrow(
      /Cannot delete the default rubric/,
    );
  });

  it("resetRubricContent clears the file but keeps the manifest entry", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await resetRubricContent("cmgc-pde", "default");
    expect(await loadRubric("cmgc-pde", "default")).toBeNull();
    const list = await listRubrics("cmgc-pde");
    expect(list.some((r) => r.id === "default")).toBe(true);
  });

  it("rejects an unknown use-case id", async () => {
    await expect(listRubrics("nope-not-real")).rejects.toThrow(/Unknown rubric use case/);
  });

  it("rejects a use-case id with a path-traversal segment", async () => {
    await expect(listRubrics("../sneak")).rejects.toThrow(/Unknown rubric use case/);
  });

  it("each use case keeps its own manifest + rubrics", async () => {
    await createRubric("cmgc-pde", { id: "pilot", label: "Pilot" });
    await createRubric("cucp-reevals", { id: "draft", label: "Draft" });
    const a = await listRubrics("cmgc-pde");
    const b = await listRubrics("cucp-reevals");
    expect(a.map((r) => r.id).sort()).toEqual(["default", "pilot"]);
    expect(b.map((r) => r.id).sort()).toEqual(["default", "draft"].sort());
  });

  it("handles a pre-existing empty directory (no manifest yet) by writing a fresh manifest", async () => {
    mkdirSync(join(tmp, "cmgc-pde"), { recursive: true });
    const list = await listRubrics("cmgc-pde");
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe("default");
  });

  it("saveRubric creates v001 snapshot on first save and increments thereafter", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    const v1 = await listVersions("cmgc-pde", "default");
    expect(v1).toHaveLength(1);
    expect(v1[0]!.id).toBe("v001");
    expect(v1[0]!.source).toBe("edit");

    await saveRubric("cmgc-pde", "default", { v: 2 }, { source: "edit", note: "tightened C-tier" });
    const v2 = await listVersions("cmgc-pde", "default");
    expect(v2).toHaveLength(2);
    expect(v2[0]!.id).toBe("v002"); // newest-first
    expect(v2[0]!.note).toBe("tightened C-tier");
    expect(v2[1]!.id).toBe("v001");
  });

  it("loadRubric with versionId reads the immutable snapshot, not the live file", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await saveRubric("cmgc-pde", "default", { v: 2 });
    const live = await loadRubric("cmgc-pde", "default");
    expect(live).toEqual({ v: 2 });
    const old = await loadRubric("cmgc-pde", "default", "v001");
    expect(old).toEqual({ v: 1 });
  });

  it("loadRubric returns null for an unknown versionId", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    expect(await loadRubric("cmgc-pde", "default", "v999")).toBeNull();
  });

  it("listVersions returns an empty array for a rubric with no history yet", async () => {
    // Manifest exists (default seeded) but saveRubric was never called.
    expect(await listVersions("cmgc-pde", "default")).toEqual([]);
  });

  it("listVersions rejects an unsafe versionId shape via load", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await expect(loadRubric("cmgc-pde", "default", "../etc/passwd")).rejects.toThrow(/Invalid version id/);
    await expect(loadRubric("cmgc-pde", "default", "v1")).rejects.toThrow(/Invalid version id/);
  });

  it("deleteVersion removes a non-newest version and its manifest entry", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await saveRubric("cmgc-pde", "default", { v: 2 });
    await saveRubric("cmgc-pde", "default", { v: 3 });
    await deleteVersion("cmgc-pde", "default", "v002");
    const list = await listVersions("cmgc-pde", "default");
    expect(list.map((v) => v.id)).toEqual(["v003", "v001"]);
  });

  it("deleteVersion rejects deleting the newest version", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await saveRubric("cmgc-pde", "default", { v: 2 });
    await expect(deleteVersion("cmgc-pde", "default", "v002")).rejects.toThrow(/newest/i);
  });

  it("deleteVersion rejects deleting the only remaining version", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await expect(deleteVersion("cmgc-pde", "default", "v001")).rejects.toThrow(/only remaining/i);
  });

  it("deleteVersion rejects an unknown version", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await saveRubric("cmgc-pde", "default", { v: 2 });
    await expect(deleteVersion("cmgc-pde", "default", "v099")).rejects.toThrow(/Unknown version/i);
  });

  it("deleteVersion rejects unsafe version id shapes", async () => {
    await saveRubric("cmgc-pde", "default", { v: 1 });
    await expect(deleteVersion("cmgc-pde", "default", "../etc/passwd")).rejects.toThrow(/Invalid version id/);
  });
});
