import { DEPENDENCY_GROUPS } from "../data/valid-categories";

export function orderCategoriesByDependencyGroups<T>(
  categoryDict: Record<string, T>,
): { category: string; rubric: T }[] {
  const out: { category: string; rubric: T }[] = [];
  const seen = new Set<string>();
  const groups = [
    DEPENDENCY_GROUPS.DELEGATION,
    DEPENDENCY_GROUPS.HABU,
    DEPENDENCY_GROUPS.APPROACHES,
    DEPENDENCY_GROUPS.ACQUISITION,
    DEPENDENCY_GROUPS.DOCUMENTS,
  ];
  for (const group of groups) {
    for (const cat of group) {
      if (cat in categoryDict && !seen.has(cat)) {
        out.push({ category: cat, rubric: categoryDict[cat]! });
        seen.add(cat);
      }
    }
  }
  for (const [cat, rubric] of Object.entries(categoryDict)) {
    if (!seen.has(cat)) {
      out.push({ category: cat, rubric });
      seen.add(cat);
    }
  }
  return out;
}
