type Rendezvous = {
  promise: Promise<unknown>;
  resolve: (v: unknown) => void;
  createdAt: number;
};

const map = new Map<string, Rendezvous>();
const TTL_MS = 15 * 60 * 1000;

function reapStale() {
  const now = Date.now();
  for (const [k, v] of map.entries()) {
    if (now - v.createdAt > TTL_MS) map.delete(k);
  }
}

export function waitForHumanResponse<T = unknown>(runId: string): Promise<T> {
  reapStale();
  const existing = map.get(runId);
  if (existing) return existing.promise as Promise<T>;
  let resolve!: (v: unknown) => void;
  const promise = new Promise<unknown>((r) => {
    resolve = r;
  });
  map.set(runId, { promise, resolve, createdAt: Date.now() });
  return promise as Promise<T>;
}

export function resolveHumanResponse(runId: string, payload: unknown): boolean {
  const r = map.get(runId);
  if (!r) return false;
  r.resolve(payload);
  map.delete(runId);
  return true;
}

export function __clearRendezvous(): void {
  map.clear();
}
