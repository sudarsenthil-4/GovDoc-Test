import type { StepEvent } from "@/lib/usecases/types";

export function sseStream(gen: () => AsyncGenerator<StepEvent>): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const ev of gen()) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", stage: "stream", message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Connection": "keep-alive",
    },
  });
}
