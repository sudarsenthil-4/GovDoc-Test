import { describe, it, expect } from "vitest";
import {
  VALID_CATEGORIES,
  DEPENDENCY_GROUPS,
  VISION_FALLBACK_CATEGORIES,
} from "./valid-categories";

describe("VALID_CATEGORIES", () => {
  it("has exactly 34 entries", () => {
    expect(VALID_CATEGORIES.length).toBe(34);
  });

  it("all DEPENDENCY_GROUPS entries are members of VALID_CATEGORIES", () => {
    const set = new Set<string>(VALID_CATEGORIES);
    for (const [groupName, entries] of Object.entries(DEPENDENCY_GROUPS)) {
      for (const entry of entries) {
        expect(set.has(entry), `${groupName}: "${entry}" not in VALID_CATEGORIES`).toBe(true);
      }
    }
  });

  it("all VISION_FALLBACK_CATEGORIES entries are members of VALID_CATEGORIES", () => {
    const set = new Set<string>(VALID_CATEGORIES);
    for (const entry of VISION_FALLBACK_CATEGORIES) {
      expect(set.has(entry), `"${entry}" not in VALID_CATEGORIES`).toBe(true);
    }
  });
});
