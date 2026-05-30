import { describe, it, expect } from "vitest";
import { orderCategoriesByDependencyGroups } from "./group-categories";
import { DEPENDENCY_GROUPS } from "../data/valid-categories";
import rubricSchema from "../assets/rubric_schema.json";

describe("orderCategoriesByDependencyGroups", () => {
  it("full rubric schema: correct length and DELEGATION first, then HABU", () => {
    const out = orderCategoriesByDependencyGroups(rubricSchema as Record<string, unknown>);

    // Length must match both rubric key count and 34 known categories
    expect(out.length).toBe(Object.keys(rubricSchema).length);
    expect(out.length).toBe(34);

    // First 4 must be DELEGATION group in order
    const delegationGroup = DEPENDENCY_GROUPS.DELEGATION;
    for (let i = 0; i < delegationGroup.length; i++) {
      expect(out[i]!.category).toBe(delegationGroup[i]);
    }

    // Next 3 must be HABU group in order
    const habuGroup = DEPENDENCY_GROUPS.HABU;
    for (let i = 0; i < habuGroup.length; i++) {
      expect(out[4 + i]!.category).toBe(habuGroup[i]);
    }
  });

  it("partial dict: dependency-group categories go first, rest follow insertion order", () => {
    const input = { x: 1, y: 2, "Title Page": 3 };
    const out = orderCategoriesByDependencyGroups(input);

    // "Title Page" is in DELEGATION group → must come first
    expect(out[0]!.category).toBe("Title Page");
    expect(out[0]!.rubric).toBe(3);

    // Remaining keys in insertion order
    expect(out[1]!.category).toBe("x");
    expect(out[2]!.category).toBe("y");
    expect(out.length).toBe(3);
  });

  it("empty dict returns empty array", () => {
    expect(orderCategoriesByDependencyGroups({})).toEqual([]);
  });
});
