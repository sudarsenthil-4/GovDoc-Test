// Client-safe rubric type and defaults for ROW. Server-side loader is in
// rubric-merged.ts.
import rubricSchema from "./assets/rubric_schema.json";

export type RowRubricData = Record<
  string,
  Record<"1" | "2" | "3" | "4" | "5", string>
>;

export function defaultRowRubric(): RowRubricData {
  return rubricSchema as RowRubricData;
}
