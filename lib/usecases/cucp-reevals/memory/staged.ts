import type { Classification, Criterion, L1Override } from "@/lib/usecases/cucp-reevals/types";
import type { Precedent } from "./precedents";

export type L2OverridePayload = {
  fact_id: string;
  new_category: string;
  reason: string;
};

export type L3OverridePayload = {
  s_no: string;
  verdict: "Pass" | "Fail";
  request_info: "Yes" | "No";
  reason: string;
};

export function l2OverrideToPrecedent(
  override: L2OverridePayload,
  classifications: readonly Classification[],
): Precedent {
  const prior = classifications.find((c) => c.fact_id === override.fact_id);
  const target = prior?.classification ?? override.fact_id;
  const correction =
    override.new_category === "Keep Current (Fix Reasoning Only)" && prior?.classification
      ? prior.classification
      : override.new_category;
  return {
    target,
    correction,
    human_reasoning: override.reason,
    fact_id: override.fact_id,
  };
}

export function l3OverrideToPrecedent(
  override: L3OverridePayload,
  criteria: readonly Criterion[],
): Precedent {
  const sNo = Number(override.s_no);
  const prior = criteria.find((c) => c.s_no === sNo);
  const target =
    prior?.qualification && prior.qualification.trim().length > 0
      ? prior.qualification
      : `Criterion ${sNo}`;
  const correction =
    override.request_info === "Yes" ? `${override.verdict} (request_info=Yes)` : override.verdict;
  return {
    target,
    correction,
    human_reasoning: override.reason,
    s_no: sNo,
  };
}

export function l1OverrideToPrecedent(override: L1Override): Precedent {
  if (override.kind === "fact-field") {
    return {
      target: `Fact ${override.fact_id}: ${override.field}`,
      correction: override.corrected_value,
      human_reasoning: override.reason,
    };
  }
  if (override.kind === "specific-incident") {
    return {
      target: "Specific Incident Detail",
      correction: override.description,
      human_reasoning: override.reason,
    };
  }
  throw new Error(`Unsupported override kind for precedent: ${override.kind}`);
}
