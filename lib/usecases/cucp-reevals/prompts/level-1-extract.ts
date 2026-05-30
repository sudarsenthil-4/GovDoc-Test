import type { FirmRevenues } from "@/lib/usecases/cucp-reevals/extract/revenue-xlsx";
import type { Precedent } from "@/lib/usecases/cucp-reevals/memory/precedents";
import { buildPrecedentsBlock } from "@/lib/usecases/cucp-reevals/memory/precedents";

export function buildLevel1SystemPrompt(
  firmRevenues?: FirmRevenues,
  precedents: readonly Precedent[] = [],
): string {
  const hasRevenues = firmRevenues && Object.keys(firmRevenues).length > 0;
  const revenueContext = hasRevenues
    ? `\n\nSUPPLEMENTARY REVENUE DATA (From Excel):\n${JSON.stringify(firmRevenues, null, 2)}\nUse this data to cross-reference the firm name.`
    : "";
  const revenueInstruction = hasRevenues ? "\n2. Cross-reference the firm name with the SUPPLEMENTARY REVENUE DATA. Find exact matches." : "";
  const startingNumber = hasRevenues ? 3 : 2;
  const precedentsBlock = buildPrecedentsBlock(1, precedents);
  return `You are an expert fact-extractor acting as a paralegal reading a Social and Economic Disadvantage (SED) narrative under 49 CFR §26.67.
Your ONLY job is to extract raw facts from the text. DO NOT perform legal analysis.

INSTRUCTIONS:
1. Extract the exact Applicant Firm Name. Look SPECIFICALLY at headers, footers, subject lines, or introductory context to identify the Applicant. IGNORE third-party companies, vendors, or former employers mentioned in the body paragraphs.${revenueInstruction}
${startingNumber}. Extract any explicitly stated Personal Net Worth (PNW) of the applicant from the narrative.
${startingNumber + 1}. For EVERY incident/claim in the narrative, extract the "W5" details (When, Where, Who, What, Why, Magnitude).
${startingNumber + 2}. Flag 'demographic_flag' as true if the applicant mentions their race, ethnicity, or sex in relation to the harm.
${startingNumber + 3}. Provide a direct source quote for each fact.${precedentsBlock}${revenueContext}

OUTPUT FORMAT:
You must output ONLY valid JSON in the following format.
CRITICAL: Replace every placeholder below with REAL data extracted from the narrative. If a detail is not mentioned, use "NOT PROVIDED". NEVER return the placeholder description text itself as a value.
{
  "firm_name": "<extract exact firm name or NONE>",
  "cross_reference_result": "<extract exact revenue or FAILED>",
  "narrative_pnw": "<extract exact PNW stated in narrative or NOT PROVIDED>",
  "extracted_facts": [
    {
      "id": "fact_1",
      "when": "<date/time period or NOT PROVIDED>",
      "where": "<location or NOT PROVIDED>",
      "who": "<person/group involved or NOT PROVIDED>",
      "what": "<the specific incident described>",
      "why": "<cause/motivation or NOT PROVIDED>",
      "magnitude": "<type and amount of economic harm or NOT PROVIDED>",
      "demographic_flag": true,
      "source_quote": "<short exact quote from the narrative>"
    }
  ]
}`;
}

export function buildLevel1UserMessage(narrativeText: string): string {
  return `Applicant narrative:\n${narrativeText}\n`;
}
