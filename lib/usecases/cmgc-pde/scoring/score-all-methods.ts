import { ALL_METHODS, RATING_VALUES, SECTION_WEIGHTS, type Rating } from "../rubric";
import type { CmgcRating, MethodScore, MultiMethodResult } from "../types";
import { METHOD_AFFINITY, METHOD_PROS_CONS } from "./method-affinity";
import { computeOverrideStatus } from "./apply-overrides";

const SECTIONS = ["A", "B", "C", "D", "E", "F"] as const;
type SectionKey = (typeof SECTIONS)[number];

/**
 * Score ALL 6 delivery methods using the method-affinity matrix.
 * Ported from legacy score_all_methods (lines 860-972), skipping LLM call.
 */
export function scoreAllMethods(ratings: CmgcRating[]): MultiMethodResult {
  // Build rating lookup and section_ratings (Rating strings)
  const ratingLookup: Record<string, Rating> = {};
  const sectionRatingStrings: Record<string, Rating[]> = { A: [], B: [], C: [], D: [], E: [], F: [] };

  for (const r of ratings) {
    const qid = r.question_id;
    // `||` not `??`: empty-string ratings (legitimate when the narrative lacks
    // evidence) should fall through to the "B" default along with null/undefined.
    const rating = (r.selected_rating || "B").toUpperCase() as Rating;
    if (qid && qid[0] && qid[0] in sectionRatingStrings) {
      ratingLookup[qid] = rating;
      sectionRatingStrings[qid[0]]!.push(rating);
    }
  }

  // Compute section-level dominant ratings (legacy lines 877-890)
  // Uses RATING_VALUES to convert strings to numbers, then maps avg back
  const sectionDominant: Record<string, Rating> = {};
  for (const sec of SECTIONS) {
    const rs = sectionRatingStrings[sec] ?? [];
    if (rs.length === 0) {
      sectionDominant[sec] = "B";
    } else {
      const avg = rs.reduce((sum, r) => sum + (RATING_VALUES[r] ?? 2), 0) / rs.length;
      sectionDominant[sec] = avg >= 2.5 ? "A" : avg >= 1.5 ? "B" : "C";
    }
  }

  // Score each method (legacy lines 893-915)
  const methodScores: MethodScore[] = [];
  for (const method of ALL_METHODS) {
    let weightedSum = 0.0;
    const keyFactors: string[] = [];
    for (const sec of SECTIONS) {
      const weight = SECTION_WEIGHTS[sec];
      const dominant = sectionDominant[sec] ?? "B";
      const sectionAffinity = METHOD_AFFINITY[sec as SectionKey];
      const affinity = sectionAffinity?.[method]?.[dominant] ?? 0.5;
      weightedSum += affinity * weight;
      if (affinity >= 0.8) {
        keyFactors.push(`${sec}: Strong fit (${dominant})`);
      } else if (affinity <= 0.2) {
        keyFactors.push(`${sec}: Poor fit (${dominant})`);
      }
    }
    methodScores.push({
      method,
      score: Math.round(weightedSum * 10000) / 10000,
      rank: 0, // assigned after sort
      blocked: false,
      block_reasons: [],
      pros: METHOD_PROS_CONS[method]?.pros ?? [],
      cons: METHOD_PROS_CONS[method]?.cons ?? [],
      key_factors: keyFactors.slice(0, 5),
    });
  }

  // Apply override blocks (legacy lines 917-932)
  const overrideStatus = computeOverrideStatus(ratingLookup);
  const blockedMethods = new Set<string>();
  for (const o of overrideStatus) {
    if (o.triggered) {
      for (const b of o.blocks) {
        blockedMethods.add(b);
      }
    }
  }

  for (const ms of methodScores) {
    if (blockedMethods.has(ms.method)) {
      ms.blocked = true;
      ms.block_reasons = overrideStatus
        .filter((o) => o.triggered && o.blocks.includes(ms.method))
        .map((o) => `${o.rule_id}: ${o.rule_name}`);
    }
  }

  // Rank: unblocked first, then by score descending (legacy lines 934-937)
  methodScores.sort((a, b) => {
    if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    return b.score - a.score;
  });
  for (let i = 0; i < methodScores.length; i++) {
    methodScores[i]!.rank = i + 1;
  }

  // Borderline comparison for top 2-3 unblocked (legacy lines 940-966)
  const unblocked = methodScores.filter((ms) => !ms.blocked);
  let borderlineComparison: MultiMethodResult["borderline_comparison"] = null;

  if (unblocked.length >= 2 && unblocked[0]!.score - unblocked[1]!.score <= 0.05) {
    const topMethods =
      unblocked.length >= 3 && unblocked[0]!.score - unblocked[2]!.score <= 0.10
        ? unblocked.slice(0, 3)
        : unblocked.slice(0, 2);
    borderlineComparison = {
      is_close: true,
      score_gap: Math.round((unblocked[0]!.score - unblocked[1]!.score) * 10000) / 10000,
      methods: topMethods.map((m) => ({
        method: m.method,
        score: m.score,
        pros: m.pros,
        cons: m.cons,
        key_factors: m.key_factors,
      })),
    };
  }

  return {
    method_scores: methodScores,
    borderline_comparison: borderlineComparison,
    override_status: overrideStatus,
  };
}
