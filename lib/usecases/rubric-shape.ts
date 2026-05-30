// Use-case-aware shape validation for uploaded/posted rubrics. Keep the
// schema logic here (not in rubric-merged.ts) so HTTP routes can call it
// without pulling in the bundled-default constants and risking circulars.

export type ShapeResult = { ok: true } | { ok: false; error: string };

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function validateCmgc(data: unknown): ShapeResult {
  if (!isObj(data)) return { ok: false, error: "Rubric must be a JSON object" };
  const { questions, weights } = data;
  if (!Array.isArray(questions)) return { ok: false, error: "`questions` must be an array" };
  for (const [i, q] of questions.entries()) {
    if (!isObj(q)) return { ok: false, error: `questions[${i}] is not an object` };
    for (const k of ["id", "section", "question", "option_a", "option_b", "option_c"]) {
      if (typeof q[k] !== "string") {
        return { ok: false, error: `questions[${i}].${k} must be a string` };
      }
    }
  }
  if (!isObj(weights)) return { ok: false, error: "`weights` must be an object" };
  for (const k of ["A", "B", "C", "D", "E", "F"]) {
    if (typeof weights[k] !== "number") {
      return { ok: false, error: `weights.${k} must be a number` };
    }
  }
  return { ok: true };
}

function validateCucp(data: unknown): ShapeResult {
  if (!isObj(data)) return { ok: false, error: "Rubric must be a JSON object" };
  // CUCP's structured rubric carries categories + criteria. Keep the guard
  // permissive (only field-presence) — prompt builders are hardcoded today,
  // so over-strict validation here would just block valid uploads.
  if (!Array.isArray(data.categories)) {
    return { ok: false, error: "`categories` must be an array" };
  }
  if (!Array.isArray(data.criteria)) {
    return { ok: false, error: "`criteria` must be an array" };
  }
  return { ok: true };
}

function validateRow(data: unknown): ShapeResult {
  if (!isObj(data)) return { ok: false, error: "Rubric must be a JSON object" };
  if (!Array.isArray(data.categories)) {
    return { ok: false, error: "`categories` must be an array" };
  }
  return { ok: true };
}

export function validateRubricShape(usecaseId: string, data: unknown): ShapeResult {
  switch (usecaseId) {
    case "cmgc-pde":
      return validateCmgc(data);
    case "cucp-reevals":
      return validateCucp(data);
    case "row-appraisal":
      return validateRow(data);
    default:
      return { ok: false, error: `Unknown use case: ${usecaseId}` };
  }
}
