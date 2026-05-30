// Structured CUCP rubric data for UI consumption (Preview Rubric).
//
// This file is intentionally a parallel copy of the rubric text that is
// inlined in the two prompt builders:
//   - prompts/level-2-classify.ts  (5 L2 legal categories)
//   - prompts/level-3-threshold.ts (7 L3 criteria)
//
// The prompt strings are NOT regenerated from this data — they stay
// byte-identical to what the LLM has always seen. The two sources are kept
// in sync by a regression test in rubric.test.ts that asserts every name /
// description / criterion-line from this file appears verbatim in the
// corresponding system prompt. v2 (editable rubrics) will collapse this
// duplication.

export type CucpL2Category = {
  readonly name: string;
  readonly description: string;
};

export type CucpL3Criterion = {
  readonly s_no: number;
  readonly name: string;
  readonly rule?: string;
  // Display title used by the Preview Rubric view (matches the PDF section
  // heading for that criterion). Falls back to `name` when omitted. The L3
  // prompt continues to use `name` verbatim — drift-guard test enforces this.
  readonly title?: string;
  // PASS / FAIL definitions from the §26.67 SED rubric PDF. Optional so saved
  // rubrics from before these fields were added still validate.
  readonly pass?: string;
  readonly fail?: string;
};

export const CUCP_L2_CATEGORIES: readonly CucpL2Category[] = [
  {
    name: "Social Disadvantage",
    description:
      "Personal experiences of discrimination — bias in contracting, exclusion from networks, personal prejudice",
  },
  {
    name: "Economic Disadvantage",
    description:
      "Capital access barriers — denied loans, bonding difficulties, financial limitations",
  },
  {
    name: "Institutional/Systemic Barrier",
    description:
      "Discriminatory institutional policies — not individual acts, but systemic patterns",
  },
  {
    name: "Ordinary Business Risk",
    description:
      "Setbacks from normal market forces — competition, pricing, general economy",
  },
  {
    name: "Insufficient Evidence",
    description: "The incident lacks enough detail to classify under §26.67",
  },
] as const;

export const CUCP_L3_CRITERIA: readonly CucpL3Criterion[] = [
  {
    s_no: 1,
    name: "Meets Requirements of SED (No Race or Sex Presumptions)",
    title: "Meets Requirements of SED",
    pass: "Narrative includes individualized examples of social and economic disadvantage and is not based in whole or in part on race or sex.",
    fail: "Narrative does not include individualized examples of social and economic disadvantage or relies on race or sex presumptions.",
  },
  {
    s_no: 2,
    name: "Meets Personal Net Worth (PNW < $2.047M)",
    title: "Meets Personal Net Worth (PNW)",
    rule:
      "Review the Excel Cross-Reference Revenue/PNW. HOWEVER, if the 'Narrative Declared PNW' provides a specific number, it OVERRIDES the Excel data.",
    pass: "PNW is $2.047 million or less.",
    fail: "PNW exceeds threshold of $2.047 million.",
  },
  {
    s_no: 3,
    name: "Meets Disadvantage in American Society",
    title: "Meets Disadvantage in American Society",
    pass: "Narrative provides experience of social and economic disadvantage within American society.",
    fail: "Narrative does not describe experiences of social and economic disadvantage within American society.",
  },
  {
    s_no: 4,
    name: "Demonstration of Disadvantage (Past Experiences)",
    pass: "Narrative provides clear, specific individualized examples of lived experiences of social and economic disadvantage within American society that impeded progress or success.",
    fail: "Narrative provides only general statements of social and economic disadvantage without clear, specific, and individualized examples.",
  },
  {
    s_no: 5,
    name: "Evidence of Specific Impediments",
    pass: "Narrative describes fact-based examples of systemic barriers, denied opportunities, and/or economic hardship (e.g. education, employment, business, financing) that establishes the existence of disadvantage by a preponderance of the evidence (i.e., is more probable than not).",
    fail: "Narrative mentions barriers in broad/general terms without supporting detail or provides no examples of specific impediments that establishes the existence of disadvantage by a preponderance of the evidence.",
  },
  {
    s_no: 6,
    name: "Link Between Impediments and Harm",
    pass: "Narrative clearly explains how impediments or barriers caused direct economic harm; includes detail on the type and magnitude (e.g., lost contracts, financial losses, comparative disadvantage).",
    fail: "Narrative states economic harm occurred but does not explain how the barriers caused economic harm.",
  },
  {
    s_no: 7,
    name: "Economic Disadvantage in Fact",
    pass: "Narrative and financial data demonstrates that the owner is economically disadvantaged compared to similarly situated non-disadvantaged individuals.",
    fail: "Narrative mentions economic disadvantage but provides weak, inconsistent, or no evidence of such disadvantage.",
  },
] as const;
