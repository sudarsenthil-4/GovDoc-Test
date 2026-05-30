import type { ExtractedFact } from "@/lib/usecases/cucp-reevals/types";
import type { Precedent } from "@/lib/usecases/cucp-reevals/memory/precedents";
import { buildPrecedentsBlock } from "@/lib/usecases/cucp-reevals/memory/precedents";
import { CUCP_L2_CATEGORIES, type CucpL2Category } from "../rubric";

function renderCategories(categories: readonly CucpL2Category[]): string {
  return categories
    .map((c) => `- "${c.name}" (${c.description})`)
    .join("\n");
}

export function buildLevel2SystemPrompt(
  precedents: readonly Precedent[] = [],
  categories: readonly CucpL2Category[] = CUCP_L2_CATEGORIES,
): string {
  const precedentsBlock = buildPrecedentsBlock(2, precedents);
  return `You are an expert legal definer for 49 CFR §26.67 SED determinations.
Your job is to look at extracted raw facts and classify them legally.

Categories to choose from:
${renderCategories(categories)}${precedentsBlock}

OUTPUT FORMAT:
Return valid JSON mapping each input fact ID to a classification.
{
  "classifications": [
    {
      "fact_id": "fact_1",
      "classification": "Chosen Category",
      "summary": "One-sentence plain-language summary of the fact being classified",
      "reasoning": "Explanation based on 49 CFR §26.67"
    }
  ]
}`;
}

export function buildLevel2UserMessage(facts: ExtractedFact[], combinedFinancials: string): string {
  return `Financial Context:\n${combinedFinancials}\n\nExtracted Facts to classify:\n${JSON.stringify(facts, null, 2)}`;
}
