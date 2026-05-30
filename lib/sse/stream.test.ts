// @vitest-environment node
import { describe, it, expect } from "vitest";
import { sseStream } from "./stream";
import { collectSseEvents } from "@/tests/utils/sse";
import type { StepEvent } from "@/lib/usecases/types";

describe("sseStream", () => {
  it("streams generator events as text/event-stream", async () => {
    const res = sseStream(async function* () {
      yield { type: "progress", stage: "init", pct: 0 } as StepEvent;
      yield { type: "done", result: { ok: true } } as StepEvent;
    });
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    const events = await collectSseEvents(res);
    expect(events).toHaveLength(2);
    expect(events[0]?.type).toBe("progress");
    expect(events[1]?.type).toBe("done");
  });

  it("emits an error event when the generator throws", async () => {
    const res = sseStream(async function* () {
      yield { type: "progress", stage: "x", pct: 0 } as StepEvent;
      throw new Error("boom");
    });
    const events = await collectSseEvents(res);
    expect(events.at(-1)).toMatchObject({ type: "error", message: "boom" });
  });
});
