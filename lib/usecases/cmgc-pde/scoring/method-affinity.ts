import type { Rating } from "../rubric";
import { SECTION_WEIGHTS } from "../rubric";

// Method-affinity matrix ported from legacy lines 708-763.
// Each section maps to how strongly an "A" vs "C" rating favors each method.
// Values: 1.0 = strongly favors, 0.5 = neutral, 0.0 = disfavors.
// NOTE: In affinity matrix semantics A=low-complexity end, C=high-complexity end
// (opposite of rubric rating semantics).
export const METHOD_AFFINITY: Readonly<
  Record<"A" | "B" | "C" | "D" | "E" | "F", Record<string, Record<Rating, number>>>
> = {
  // Section A: Project Scope & Characteristics — high complexity favors CMGC/DB/PDB
  A: {
    "Design-Bid-Build":         { A: 1.0, B: 0.6, C: 0.1 },
    "Design-Sequencing":        { A: 0.8, B: 0.6, C: 0.2 },
    "Design-Build/Low-Bid":     { A: 0.3, B: 0.5, C: 0.7 },
    "Design-Build/Best-Value":  { A: 0.2, B: 0.5, C: 0.8 },
    "CM/GC":                    { A: 0.3, B: 0.6, C: 0.9 },
    "Progressive Design-Build": { A: 0.1, B: 0.4, C: 0.9 },
  },
  // Section B: Schedule Issues — urgency favors DB, CMGC, PDB
  B: {
    "Design-Bid-Build":         { A: 0.9, B: 0.5, C: 0.1 },
    "Design-Sequencing":        { A: 0.7, B: 0.5, C: 0.3 },
    "Design-Build/Low-Bid":     { A: 0.3, B: 0.6, C: 0.8 },
    "Design-Build/Best-Value":  { A: 0.3, B: 0.6, C: 0.8 },
    "CM/GC":                    { A: 0.4, B: 0.6, C: 0.8 },
    "Progressive Design-Build": { A: 0.3, B: 0.5, C: 0.8 },
  },
  // Section C: Innovation — high innovation favors DB/BV, CMGC, PDB
  C: {
    "Design-Bid-Build":         { A: 0.9, B: 0.5, C: 0.1 },
    "Design-Sequencing":        { A: 0.7, B: 0.5, C: 0.2 },
    "Design-Build/Low-Bid":     { A: 0.4, B: 0.5, C: 0.6 },
    "Design-Build/Best-Value":  { A: 0.2, B: 0.5, C: 0.9 },
    "CM/GC":                    { A: 0.3, B: 0.6, C: 0.8 },
    "Progressive Design-Build": { A: 0.2, B: 0.5, C: 0.9 },
  },
  // Section D: Quality Enhancement — high quality needs favor DB/BV, CMGC
  D: {
    "Design-Bid-Build":         { A: 0.8, B: 0.5, C: 0.2 },
    "Design-Sequencing":        { A: 0.7, B: 0.5, C: 0.3 },
    "Design-Build/Low-Bid":     { A: 0.5, B: 0.5, C: 0.5 },
    "Design-Build/Best-Value":  { A: 0.3, B: 0.5, C: 0.8 },
    "CM/GC":                    { A: 0.3, B: 0.6, C: 0.8 },
    "Progressive Design-Build": { A: 0.3, B: 0.5, C: 0.8 },
  },
  // Section E: Cost Issues — constrained funding favors DBB; full funding favors DB
  E: {
    "Design-Bid-Build":         { A: 0.8, B: 0.6, C: 0.3 },
    "Design-Sequencing":        { A: 0.7, B: 0.5, C: 0.3 },
    "Design-Build/Low-Bid":     { A: 0.3, B: 0.5, C: 0.7 },
    "Design-Build/Best-Value":  { A: 0.2, B: 0.5, C: 0.7 },
    "CM/GC":                    { A: 0.4, B: 0.6, C: 0.7 },
    "Progressive Design-Build": { A: 0.2, B: 0.5, C: 0.8 },
  },
  // Section F: Staffing — lack of expertise favors DB, PDB, CMGC
  F: {
    "Design-Bid-Build":         { A: 0.8, B: 0.5, C: 0.1 },
    "Design-Sequencing":        { A: 0.7, B: 0.5, C: 0.2 },
    "Design-Build/Low-Bid":     { A: 0.4, B: 0.5, C: 0.6 },
    "Design-Build/Best-Value":  { A: 0.3, B: 0.5, C: 0.7 },
    "CM/GC":                    { A: 0.5, B: 0.6, C: 0.7 },
    "Progressive Design-Build": { A: 0.3, B: 0.5, C: 0.8 },
  },
} as const;

// Method pros/cons ported from legacy lines 770-796.
export const METHOD_PROS_CONS: Readonly<Record<string, { pros: string[]; cons: string[] }>> = {
  "Design-Bid-Build": {
    pros: ["Lowest procurement cost", "Well-understood process", "Competitive bidding on fully defined scope", "Department retains full design control"],
    cons: ["Longest delivery schedule", "No early work packages", "Higher change order risk", "All design risks on Department"],
  },
  "Design-Sequencing": {
    pros: ["Sequential design packages allow phased delivery", "Department retains design control", "Lower procurement complexity than DB"],
    cons: ["Still relatively slow", "Limited contractor input during design", "No three-party collaboration"],
  },
  "Design-Build/Low-Bid": {
    pros: ["Parallel design and construction", "Risk transfer to Design-Builder", "Schedule compression possible"],
    cons: ["Less focus on quality/innovation", "Higher procurement costs", "30% design needed for RFP", "Less Department control over final design"],
  },
  "Design-Build/Best-Value": {
    pros: ["ATCs drive innovation", "Best quality-price balance", "Parallel design and construction", "Risk transfer to Design-Builder"],
    cons: ["Highest procurement cost (stipends)", "Complex two-phase procurement", "Requires well-defined contract requirements"],
  },
  "CM/GC": {
    pros: ["Three-party collaboration", "Early contractor input", "Early work packages possible", "Flexible agreed-price negotiation", "Department retains design ownership"],
    cons: ["If agreed price fails, reverts to DBB", "Requires sophisticated procurement", "Preconstruction services add cost"],
  },
  "Progressive Design-Build": {
    pros: ["Three-party collaboration", "Can start at PA&ED phase", "Maximum innovation opportunity", "Early work packages", "Design-Builder owns final design"],
    cons: ["Requires >$25M project cost", "Complex procurement", "If price fails, must use other methods", "Department has less design control"],
  },
} as const;

const SECTIONS = ["A", "B", "C", "D", "E", "F"] as const;
type SectionKey = (typeof SECTIONS)[number];

/**
 * Return the weighted affinity score (0-1) for one method.
 *
 * Ported verbatim from legacy lines 619-631.
 * sectionRatings: per-section array of raw numeric values (1=A, 2=B, 3=C).
 *
 * IMPORTANT: The dominant mapping is intentionally "inverted" relative to the
 * rubric rating semantics:
 *   avg >= 2.5  →  dominant "A"  (high raw = "A" affinity slot)
 *   avg < 1.5   →  dominant "C"
 *   else        →  dominant "B"
 * This matches the legacy formula exactly — do not change it.
 */
export function affinityScoreForMethod(
  method: string,
  sectionRatings: Record<string, number[]>,
): number {
  let total = 0.0;
  for (const sec of SECTIONS) {
    const weight = SECTION_WEIGHTS[sec];
    const secVals = sectionRatings[sec] ?? [];
    let dominant: Rating;
    if (secVals.length === 0) {
      dominant = "B";
    } else {
      const avg = secVals.reduce((a, b) => a + b, 0) / secVals.length;
      dominant = avg >= 2.5 ? "A" : avg < 1.5 ? "C" : "B";
    }
    const sectionAffinity = METHOD_AFFINITY[sec as SectionKey];
    const affinity = sectionAffinity?.[method]?.[dominant] ?? 0.5;
    total += affinity * weight;
  }
  return Math.round(total * 10000) / 10000;
}
