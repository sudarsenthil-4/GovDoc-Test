import type { Classification, ExtractedFact } from "@/lib/usecases/cucp-reevals/types";
import type { Precedent } from "@/lib/usecases/cucp-reevals/memory/precedents";
import { buildPrecedentsBlock } from "@/lib/usecases/cucp-reevals/memory/precedents";
import { CUCP_L3_CRITERIA, type CucpL3Criterion } from "../rubric";

function renderCriteria(criteria: readonly CucpL3Criterion[]): string {
  return criteria
    .map((c) => (c.rule ? `${c.s_no}. ${c.name}. Rule: ${c.rule}` : `${c.s_no}. ${c.name}`))
    .join("\n");
}

export function buildLevel3SystemPrompt(
  precedents: readonly Precedent[] = [],
  criteria: readonly CucpL3Criterion[] = CUCP_L3_CRITERIA,
): string {
  const precedentsBlock = buildPrecedentsBlock(3, precedents);
  return `You are the final evaluator applying the exact standard of proof (Preponderance of the Evidence) under 49 CFR §26.67.
You will evaluate against the 7 mandatory CUCP criteria based on the classified evidence.

The 7 Criteria rows are exactly:
${renderCriteria(criteria)}${precedentsBlock}

OUTPUT FORMAT:
Return valid JSON exactly matching this structure.
pass_fail MUST be "Pass" or "Fail".
request_info MUST be "Yes" or "No".
{
  "criteria": [
    {
      "s_no": 1,
      "category": "Mandatory Eligibility Requirements",
      "qualification": "No Race or Sex Presumptions",
      "rule_requires": "Narrative includes individualized examples of social and economic disadvantage without race or sex presumptions",
      "evidence_summary": "1-2 sentence summary of applicant's evidence",
      "reasoning": "Why it passes or fails",
      "pass_fail": "Pass" or "Fail",
      "request_info": "Yes" or "No",
      "confidence": 9.5
    },
    ... Include all 7 criteria ...
  ],
  "final_decision": "Yes" or "No" or "Not eligible at this time (pending additional information)",
  "certifier_comments": "Professional executive summary of the evaluation."
}`;
}

export function buildLevel3UserMessage(
  classifications: Classification[],
  facts: ExtractedFact[],
  pnwResult: string,
): string {
  return `Classified Evidence:\n${JSON.stringify(classifications, null, 2)}\n\nRaw Facts:\n${JSON.stringify(facts, null, 2)}\n\nPNW Data point: ${pnwResult}`;
}
