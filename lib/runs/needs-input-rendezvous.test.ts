import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  waitForHumanResponse,
  resolveHumanResponse,
  __clearRendezvous,
} from "./needs-input-rendezvous";

describe("needs-input rendezvous", () => {
  beforeEach(() => {
    __clearRendezvous();
  });
  afterEach(() => {
    vi.useRealTimers();
    __clearRendezvous();
  });

  it("waitForHumanResponse returns a pending promise that resolveHumanResponse fulfils", async () => {
    const promise = waitForHumanResponse<{ overrides: number[] }>("run-1");
    const ok = resolveHumanResponse("run-1", { overrides: [3, 5] });
    expect(ok).toBe(true);
    await expect(promise).resolves.toEqual({ overrides: [3, 5] });
  });

  it("resolveHumanResponse for an unknown runId returns false", () => {
    expect(resolveHumanResponse("never-existed", { x: 1 })).toBe(false);
  });

  it("a second waitForHumanResponse for the same runId returns the same promise", async () => {
    const p1 = waitForHumanResponse("run-2");
    const p2 = waitForHumanResponse("run-2");
    expect(p1).toBe(p2);
    resolveHumanResponse("run-2", "ok");
    await expect(p1).resolves.toBe("ok");
  });

  it("resolves only once — a second resolveHumanResponse on the same runId returns false", () => {
    waitForHumanResponse("run-3");
    expect(resolveHumanResponse("run-3", "first")).toBe(true);
    expect(resolveHumanResponse("run-3", "second")).toBe(false);
  });

  it("reaps stale rendezvous entries past TTL on the next call", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T00:00:00.000Z"));
    waitForHumanResponse("run-4");

    // advance past the 15-min TTL
    vi.setSystemTime(new Date("2026-05-05T00:16:00.000Z"));
    // Triggering a new wait must reap stale entries:
    waitForHumanResponse("run-5");

    // run-4 should now be unknown
    expect(resolveHumanResponse("run-4", "late")).toBe(false);
    // run-5 still resolves
    expect(resolveHumanResponse("run-5", "fresh")).toBe(true);
  });
});
