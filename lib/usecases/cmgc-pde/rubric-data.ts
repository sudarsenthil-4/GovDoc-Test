// Client-safe rubric type and defaults for CMGC. Importing this module from
// a client component is fine — it has no Node-only deps. The server-side
// loader (which reads from disk) lives in rubric-merged.ts.
import { RUBRIC_QUESTIONS, SECTION_WEIGHTS, type RubricQuestion } from "./rubric";

export type CmgcRubricData = {
  questions: readonly RubricQuestion[];
  weights: Readonly<Record<"A" | "B" | "C" | "D" | "E" | "F", number>>;
};

export function defaultCmgcRubric(): CmgcRubricData {
  return { questions: RUBRIC_QUESTIONS, weights: SECTION_WEIGHTS };
}
