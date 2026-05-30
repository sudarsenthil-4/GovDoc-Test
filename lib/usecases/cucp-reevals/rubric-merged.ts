import type { CucpL2Category, CucpL3Criterion } from "./rubric";
import { loadRubric } from "../rubrics-store";
import { defaultCucpRubric, type CucpRubricData } from "./rubric-data";
export type { CucpRubricData } from "./rubric-data";
export { defaultCucpRubric } from "./rubric-data";

function isValidL2(x: unknown): x is CucpL2Category {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.name === "string" && typeof o.description === "string";
}

function isValidL3(x: unknown): x is CucpL3Criterion {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const optionalString = (v: unknown) => v === undefined || typeof v === "string";
  return (
    typeof o.s_no === "number" &&
    typeof o.name === "string" &&
    optionalString(o.rule) &&
    optionalString(o.title) &&
    optionalString(o.pass) &&
    optionalString(o.fail)
  );
}

export async function loadCucpRubric(
  rubricId?: string,
  versionId?: string,
): Promise<CucpRubricData> {
  const saved = await loadRubric("cucp-reevals", rubricId, versionId);
  if (!saved || typeof saved !== "object") return defaultCucpRubric();
  const obj = saved as { l2?: unknown; l3?: unknown };
  if (!Array.isArray(obj.l2) || !obj.l2.every(isValidL2)) return defaultCucpRubric();
  if (!Array.isArray(obj.l3) || !obj.l3.every(isValidL3)) return defaultCucpRubric();
  return { l2: obj.l2, l3: obj.l3 };
}
