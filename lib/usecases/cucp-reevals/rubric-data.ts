// Client-safe rubric type and defaults for CUCP. Server-side loader is in
// rubric-merged.ts.
import {
  CUCP_L2_CATEGORIES,
  CUCP_L3_CRITERIA,
  type CucpL2Category,
  type CucpL3Criterion,
} from "./rubric";

export type CucpRubricData = {
  l2: readonly CucpL2Category[];
  l3: readonly CucpL3Criterion[];
};

export function defaultCucpRubric(): CucpRubricData {
  return { l2: CUCP_L2_CATEGORIES, l3: CUCP_L3_CRITERIA };
}
