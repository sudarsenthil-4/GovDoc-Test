import {
  promises as fsp,
  existsSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";
import type { Level, PrecedentsByLevel } from "./precedents";
import { EMPTY_PRECEDENTS } from "./precedents";

const KEY: Record<Level, keyof PrecedentsByLevel> = {
  1: "level_1_precedents",
  2: "level_2_precedents",
  3: "level_3_precedents",
};

let storeRoot: string | null = null;
function rootDir(): string {
  if (storeRoot) return storeRoot;
  return join(process.cwd(), "data", "cucp-precedents");
}

export function __setStoreRootForTests(root: string | null): void {
  storeRoot = root;
}

function assertSafeProjectId(projectId: string): void {
  if (
    !projectId ||
    projectId.includes("/") ||
    projectId.includes("\\") ||
    projectId.includes("..") ||
    projectId.includes("\0")
  ) {
    throw new Error(`Invalid projectId: ${JSON.stringify(projectId)}`);
  }
}

function projectFile(projectId: string): string {
  assertSafeProjectId(projectId);
  return join(rootDir(), `${projectId}.json`);
}

function backupsDir(): string {
  return join(rootDir(), "backups");
}

function ensureDirs(): void {
  if (!existsSync(rootDir())) mkdirSync(rootDir(), { recursive: true });
  if (!existsSync(backupsDir())) mkdirSync(backupsDir(), { recursive: true });
}

const locks = new Map<string, Promise<void>>();

async function withLock<T>(projectId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(projectId) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => {
    release = r;
  });
  const chained = prev.then(() => next);
  locks.set(projectId, chained);
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(projectId) === chained) {
      locks.delete(projectId);
    }
  }
}

async function readFileOrEmpty(projectId: string): Promise<PrecedentsByLevel> {
  const file = projectFile(projectId);
  try {
    const raw = await fsp.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<PrecedentsByLevel>;
    return {
      level_1_precedents: parsed.level_1_precedents ?? [],
      level_2_precedents: parsed.level_2_precedents ?? [],
      level_3_precedents: parsed.level_3_precedents ?? [],
    };
  } catch {
    return {
      level_1_precedents: [...EMPTY_PRECEDENTS.level_1_precedents],
      level_2_precedents: [...EMPTY_PRECEDENTS.level_2_precedents],
      level_3_precedents: [...EMPTY_PRECEDENTS.level_3_precedents],
    };
  }
}

async function backupExisting(projectId: string): Promise<void> {
  const file = projectFile(projectId);
  if (!existsSync(file)) return;
  ensureDirs();
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = join(backupsDir(), `${projectId}-${ts}.json`);
  await fsp.copyFile(file, dest);
}

async function atomicWrite(projectId: string, db: PrecedentsByLevel): Promise<void> {
  ensureDirs();
  const final = projectFile(projectId);
  const tmp = `${final}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await fsp.writeFile(tmp, JSON.stringify(db, null, 4) + "\n", "utf8");
  await fsp.rename(tmp, final);
}

export async function loadPrecedents(projectId: string): Promise<PrecedentsByLevel> {
  assertSafeProjectId(projectId);
  return withLock(projectId, () => readFileOrEmpty(projectId));
}

export async function commitStagedPrecedents(
  projectId: string,
  staged: PrecedentsByLevel,
): Promise<void> {
  assertSafeProjectId(projectId);
  return withLock(projectId, async () => {
    await backupExisting(projectId);
    const db = await readFileOrEmpty(projectId);
    db.level_1_precedents.push(...staged.level_1_precedents);
    db.level_2_precedents.push(...staged.level_2_precedents);
    db.level_3_precedents.push(...staged.level_3_precedents);
    await atomicWrite(projectId, db);
  });
}

export async function deletePrecedent(
  projectId: string,
  level: Level,
  index: number,
): Promise<void> {
  assertSafeProjectId(projectId);
  return withLock(projectId, async () => {
    const db = await readFileOrEmpty(projectId);
    const list = db[KEY[level]];
    if (index < 0 || index >= list.length) return;
    await backupExisting(projectId);
    list.splice(index, 1);
    await atomicWrite(projectId, db);
  });
}
