import { loadRubric } from "../rubrics-store";
import { defaultRowRubric, type RowRubricData } from "./rubric-data";
export type { RowRubricData } from "./rubric-data";
export { defaultRowRubric } from "./rubric-data";

function isValidTiers(x: unknown): x is RowRubricData[string] {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (["1", "2", "3", "4", "5"] as const).every((k) => typeof o[k] === "string");
}

export async function loadRowRubric(
  rubricId?: string,
  versionId?: string,
): Promise<RowRubricData> {
  const saved = await loadRubric("row-appraisal", rubricId, versionId);
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return defaultRowRubric();
  const obj = saved as Record<string, unknown>;
  for (const v of Object.values(obj)) {
    if (!isValidTiers(v)) return defaultRowRubric();
  }
  return obj as RowRubricData;
}
