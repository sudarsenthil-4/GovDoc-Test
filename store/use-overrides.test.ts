import { describe, it, expect, beforeEach } from "vitest";
import { useOverridesStore } from "./use-overrides";

beforeEach(() => useOverridesStore.getState().clear());

describe("useOverridesStore", () => {
  it("undo/redo round-trips an entry", () => {
    const s = useOverridesStore.getState();
    s.push({ category: "c1", oldValue: "A", newValue: "B", reason: "test" });
    expect(useOverridesStore.getState().history).toHaveLength(1);
    const undone = useOverridesStore.getState().undo();
    expect(undone?.category).toBe("c1");
    expect(useOverridesStore.getState().history).toHaveLength(0);
    expect(useOverridesStore.getState().redoStack).toHaveLength(1);
    const redone = useOverridesStore.getState().redo();
    expect(redone?.category).toBe("c1");
    expect(useOverridesStore.getState().history).toHaveLength(1);
  });
});
