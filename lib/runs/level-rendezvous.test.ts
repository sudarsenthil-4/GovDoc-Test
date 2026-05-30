import { describe, it, expect, beforeEach } from "vitest";
import {
  awaitLevelDecision,
  resolveLevelDecision,
  __clearLevelRendezvous,
} from "./level-rendezvous";

beforeEach(() => __clearLevelRendezvous());

describe("level rendezvous", () => {
  it("resolves a single waiter with a typed payload", async () => {
    const promise = awaitLevelDecision<{ action: "approve" }>("run-1", 2);
    const ok = resolveLevelDecision("run-1", 2, { action: "approve" });
    expect(ok).toBe(true);
    await expect(promise).resolves.toEqual({ action: "approve" });
  });

  it("returns false when no waiter is registered for that (runId, level)", () => {
    expect(resolveLevelDecision("missing", 2, { action: "approve" })).toBe(false);
  });

  it("can be resolved a second time after a re-arm", async () => {
    const first = awaitLevelDecision<{ action: string }>("run-1", 2);
    resolveLevelDecision("run-1", 2, { action: "override-and-rerun" });
    expect(await first).toEqual({ action: "override-and-rerun" });

    const second = awaitLevelDecision<{ action: string }>("run-1", 2);
    resolveLevelDecision("run-1", 2, { action: "approve" });
    expect(await second).toEqual({ action: "approve" });
  });

  it("isolates levels within the same runId", async () => {
    const p2 = awaitLevelDecision<{ marker: string }>("run-1", 2);
    const p3 = awaitLevelDecision<{ marker: string }>("run-1", 3);
    resolveLevelDecision("run-1", 3, { marker: "three" });
    resolveLevelDecision("run-1", 2, { marker: "two" });
    expect(await p2).toEqual({ marker: "two" });
    expect(await p3).toEqual({ marker: "three" });
  });

  it("isolates runs", async () => {
    const a = awaitLevelDecision<{ which: string }>("run-a", 2);
    const b = awaitLevelDecision<{ which: string }>("run-b", 2);
    resolveLevelDecision("run-b", 2, { which: "b" });
    resolveLevelDecision("run-a", 2, { which: "a" });
    expect(await a).toEqual({ which: "a" });
    expect(await b).toEqual({ which: "b" });
  });
});
