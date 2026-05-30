type Waiter = { resolve: (v: unknown) => void; createdAt: number };
const TTL_MS = 30 * 60 * 1000;

const map = new Map<string, Waiter>();

function key(runId: string, level: number): string {
  return `${runId}::L${level}`;
}

function reapStale(): void {
  const now = Date.now();
  for (const [k, v] of map.entries()) {
    if (now - v.createdAt > TTL_MS) map.delete(k);
  }
}

export function awaitLevelDecision<T = unknown>(runId: string, level: number): Promise<T> {
  reapStale();
  const k = key(runId, level);
  let resolve!: (v: unknown) => void;
  const promise = new Promise<unknown>((r) => {
    resolve = r;
  });
  map.set(k, { resolve, createdAt: Date.now() });
  return promise as Promise<T>;
}

export function resolveLevelDecision(runId: string, level: number, payload: unknown): boolean {
  const k = key(runId, level);
  const w = map.get(k);
  if (!w) return false;
  map.delete(k);
  w.resolve(payload);
  return true;
}

export function __clearLevelRendezvous(): void {
  map.clear();
}
