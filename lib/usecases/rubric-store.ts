// Legacy single-rubric shim. The on-disk source of truth is the per-rubric
// directory layout managed by ./rubrics-store. These three functions still
// target a single rubric per use case — the one currently flagged default —
// so existing callers (rubric-merged.ts, the legacy POST/DELETE handlers)
// keep working without knowing about the manifest.
import {
  __setRubricsStoreRootForTests,
  loadRubric,
  saveRubric as multiSaveRubric,
  resetRubricContent,
  getDefaultRubricId,
} from "./rubrics-store";

export function __setRubricStoreRootForTests(root: string | null): void {
  __setRubricsStoreRootForTests(root);
}

export async function loadSavedRubric(usecaseId: string): Promise<unknown | null> {
  return loadRubric(usecaseId);
}

export async function saveRubric(usecaseId: string, data: unknown): Promise<void> {
  const id = await getDefaultRubricId(usecaseId);
  await multiSaveRubric(usecaseId, id, data);
}

export async function deleteRubric(usecaseId: string): Promise<void> {
  const id = await getDefaultRubricId(usecaseId);
  await resetRubricContent(usecaseId, id);
}
