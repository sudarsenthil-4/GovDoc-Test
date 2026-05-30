import { getExtractionRules } from "./extraction-rules";

export type ChunkRubric = Record<string, Record<string, string>>;

export function buildChunkSystemPrompt(chunkCategories: ChunkRubric): string {
  const categoryNames = Object.keys(chunkCategories);

  let extractionRules = "";
  for (const cat of categoryNames) {
    extractionRules += `\n### ${cat}\n`;
    extractionRules += getExtractionRules(cat);
  }

  let rubricRules = "";
  for (const [category, criteria] of Object.entries(chunkCategories)) {
    rubricRules += `\n## ${category}\n`;
    for (const [score, description] of Object.entries(criteria)) {
      if (description) {
        rubricRules += `- ${score}: ${description}\n`;
      } else {
        rubricRules += `- ${score}: (not specified in rubric - do NOT award this score)\n`;
      }
    }
  }

  return `You are a forensic document analyst for Caltrans Right of Way appraisals.
Your job is to EXTRACT and VERIFY facts from the document - NOT to assume or infer.

# CORE ANTI-HALLUCINATION RULES

1. If you cannot find evidence, write "NOT FOUND" - do NOT invent content
2. Use EXACT QUOTES - no paraphrasing
3. A score level is ONLY valid if its rubric criteria explicitly exists. If the rubric says "(not specified in rubric - do NOT award this score)", you CANNOT give that score.
4. Evidence text must match extraction — if extraction says NOT FOUND, evidence must say "not found" or "missing"
5. Names on title page ≠ certificates. Must see actual signed certificate.
6. "Outlined" means parcel boundary shapes traced. Colored boxes/labels can count if client-acceptable.
7. "RW lines denoted" requires explicit text: "existing right of way line", "state's right of way line", or "current right of way line". Easement lines and subparcel outlines do NOT count.
8. Cost Approach ≠ Cost to Cure. Cost guide usage in Improvements/Cost to Cure does NOT count as Cost Approach.

# N/A LOGIC — USE "N/A" (not a numeric score) WHEN:

- HABU Improved: property is unimproved/vacant (no building).
- HABU Reconciliation: only HABU Vacant was done (HABU Improved = N/A).
- Income Approach (If used): methodology states not used.
- Cost Approach (If Used): no formal Cost Approach section + methodology doesn't mention it.
- Reconciliation: only ONE valuation approach used (single-approach reports).
- Cost to Cure: report confirms no damages.
- After Analysis (if required): full acquisition with no remainder.

# CROSS-CATEGORY DEPENDENCIES

1. Before scoring HABU Improved: determine if property has a building. If unimproved → N/A.
2. Before scoring HABU Reconciliation: check HABU Improved status. If N/A → HABU Reconciliation = N/A.
3. Before scoring Reconciliation: count valuation approaches in methodology. If 1 → N/A.
4. Before scoring Cost Approach: check methodology for formal use. Cost guide for fencing ≠ Cost Approach.
5. Before scoring After Analysis: detect acquisition type (RW 7-9 Part checkbox, Introduction).
6. For Certificate of Appraiser + Delegations: cross-reference Title Page appraisers vs Certificate section names.

# CATEGORY-SPECIFIC EXTRACTION REQUIREMENTS
${extractionRules}

# RUBRIC RULES FOR THIS CHUNK
${rubricRules}

# OUTPUT FORMAT - JSON ARRAY (CRITICAL)

Output ONLY a JSON array. No markdown code fences. No text before or after. Exactly one object per category:

[
  {
    "category": "${categoryNames[0]}",
    "score": 4,
    "criteria_met": "quote from rubric for the score awarded",
    "evidence": "exact quote from document with page number",
    "status": "✅ Pass",
    "comments": "brief factual explanation"
  },
  ...
]

# STATUS RULES
- "✅ Pass" for Score 4-5
- "⚠️ Warning" for Score 3
- "❌ Fail" for Score 1-2
- "⚪ N/A" for N/A categories

# SCORING RULES
- Score based ONLY on extracted evidence
- For N/A: set "score" to the string "N/A" (not a number)
- For categories where max achievable score is 3 (e.g., Introduction, Parcel Description, Certificate of Appraiser): do NOT award Score 4 or 5 even if criteria seem exceeded.
- For blank rubric levels (e.g., Delegations Scores 2-4, Title Page Score 4): you CANNOT award these scores. Choose the next valid score.
- Be STRICT: your job is to find faults, not excuse them.
`;
}

export function buildChunkUserPrompt(categoryNames: string[]): string {
  const categoryList = categoryNames.map((cat) => `- ${cat}`).join("\n");

  return `Evaluate ONLY these ${categoryNames.length} categories:

${categoryList}

For EACH category:
1. Apply the category-specific extraction requirements
2. Check cross-category dependencies (is this an N/A category?)
3. Extract specific evidence (exact quote with page #)
4. Verify against rubric (respect blank score levels)
5. Assign score based on evidence

Output ONLY the JSON array:`;
}
