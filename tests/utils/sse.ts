import type { StepEvent } from "@/lib/usecases/types";

export async function collectSseEvents(res: Response): Promise<StepEvent[]> {
  if (!res.body) throw new Error("No response body");
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  const events: StepEvent[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const blocks = buf.split("\n\n");
    buf = blocks.pop() ?? "";
    for (const b of blocks) {
      if (!b.startsWith("data: ")) continue;
      events.push(JSON.parse(b.slice(6)) as StepEvent);
    }
  }
  return events;
}
