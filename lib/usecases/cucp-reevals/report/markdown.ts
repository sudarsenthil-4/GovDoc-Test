import type { Level1Data, Level2Data, Level3Data, AnalystOverride, L1FieldKey } from "@/lib/usecases/cucp-reevals/types";
import type { Precedent } from "@/lib/usecases/cucp-reevals/memory/precedents";

export type SessionOverrides = {
  l1FieldOverrides?: Partial<Record<L1FieldKey, { value: string; reason: string }>>;
  l1Precedents?: readonly Precedent[];
  l2Precedents?: readonly Precedent[];
  l3Precedents?: readonly Precedent[];
};

const L1_FIELD_LABEL: Record<L1FieldKey, string> = {
  firm_name: "Firm name",
  narrative_pnw: "Narrative-declared PNW",
};

function hasSessionOverrides(s?: SessionOverrides): boolean {
  if (!s) return false;
  const fields = Object.keys(s.l1FieldOverrides ?? {}).length;
  return fields + (s.l1Precedents?.length ?? 0) + (s.l2Precedents?.length ?? 0) + (s.l3Precedents?.length ?? 0) > 0;
}

function renderSessionOverridesBlock(s: SessionOverrides): string {
  let md = "";
  const l1Fields = Object.entries(s.l1FieldOverrides ?? {}) as [L1FieldKey, { value: string; reason: string }][];
  const hasL1 = l1Fields.length > 0 || (s.l1Precedents?.length ?? 0) > 0;
  if (hasL1) {
    md += `**Level 1 — Facts**\n`;
    for (const [field, entry] of l1Fields) {
      md += `- **${L1_FIELD_LABEL[field]} →** \`${entry.value}\` *(Justification: ${entry.reason})*\n`;
    }
    for (const p of s.l1Precedents ?? []) {
      md += `- **${p.target} →** \`${p.correction}\` *(Justification: ${p.human_reasoning})*\n`;
    }
    md += `\n`;
  }
  if ((s.l2Precedents?.length ?? 0) > 0) {
    md += `**Level 2 — Classifications**\n`;
    for (const p of s.l2Precedents!) {
      const id = p.fact_id ? ` ${p.fact_id}` : "";
      md += `- **Fact${id}:** \`${p.target}\` → \`${p.correction}\` *(Justification: ${p.human_reasoning})*\n`;
    }
    md += `\n`;
  }
  if ((s.l3Precedents?.length ?? 0) > 0) {
    md += `**Level 3 — Criteria**\n`;
    for (const p of s.l3Precedents!) {
      const tag = p.s_no ? `#${p.s_no} ` : "";
      md += `- **${tag}${p.target} →** \`${p.correction}\` *(Justification: ${p.human_reasoning})*\n`;
    }
    md += `\n`;
  }
  return md;
}

export function applyOverridesToLevel3(level3: Level3Data, overrides: AnalystOverride[]): Level3Data {
  if (overrides.length === 0) return level3;
  const byNo = new Map(level3.criteria.map((c) => [c.s_no, { ...c }]));
  for (const o of overrides) {
    const c = byNo.get(o.s_no);
    if (!c) continue;
    if (o.field === "pass_fail") c.pass_fail = o.value === "Pass" ? "Pass" : "Fail";
    else if (o.field === "request_info") c.request_info = o.value === "Yes" ? "Yes" : "No";
    else if (o.field === "reasoning") c.reasoning = o.value;
  }
  return { ...level3, criteria: [...byNo.values()].sort((a, b) => a.s_no - b.s_no) };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function generateFinalMarkdownReport(
  level1: Level1Data,
  level2: Level2Data,
  level3: Level3Data,
  analystOverrides: AnalystOverride[] = [],
  evaluationDateIso: string = new Date().toISOString(),
  sessionOverrides?: SessionOverrides,
): string {
  const adjusted = applyOverridesToLevel3(level3, analystOverrides);
  const dateStr = fmtDate(evaluationDateIso);

  let md = `### 📄 CUCP EVALUATION REPORT\n`;
  md += `**Document Source:** CUCP Rubric §26.67\n`;
  md += `**Evaluation Date:** ${dateStr}\n`;
  md += `**Status:** ${adjusted.final_decision ?? "Unknown"}\n\n---\n\n`;

  // Pre-scoring audit
  md += `### 🔍 PRE-SCORING AUDIT\n`;
  const facts = level1.extracted_facts ?? [];
  if (facts.length === 0) md += `NONE\n`;
  facts.forEach((f, idx) => {
    md += `**Incident ${idx + 1}: ${f.what ?? "N/A"}**\n`;
    md += `- **When:** ${f.when ?? "NOT PROVIDED"}\n`;
    md += `- **Where:** ${f.where ?? "NOT PROVIDED"}\n`;
    md += `- **Who:** ${f.who ?? "NOT PROVIDED"}\n`;
    md += `- **What:** ${f.what ?? "NOT PROVIDED"}\n`;
    md += `- **Why:** ${f.why ?? "NOT PROVIDED"}\n`;
    md += `- **How/Magnitude:** ${f.magnitude ?? "NOT PROVIDED"}\n\n`;
  });

  const showOverrides = analystOverrides.length > 0 || hasSessionOverrides(sessionOverrides);
  if (showOverrides) {
    md += `### 🧑‍⚖️ ANALYST OVERRIDES\n`;
    md += `The following manual adjustments were applied by the human reviewer during this run:\n\n`;
    if (sessionOverrides) md += renderSessionOverridesBlock(sessionOverrides);
    if (analystOverrides.length > 0) {
      md += `**Level 3 — Field edits**\n`;
      for (const o of analystOverrides) {
        md += `- **${o.field}:** ${o.value} *(Justification: ${o.reasoning})*\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n\n`;

  // Classification summary
  md += `### 🏷️ CLASSIFICATION SUMMARY\n`;
  const classifications = level2.classifications ?? [];
  if (classifications.length === 0) md += `NONE\n`;
  classifications.forEach((c, idx) => {
    md += `- **Fact ${c.fact_id ?? String(idx + 1)}** → \`${c.classification ?? "Unclassified"}\`\n`;
    md += `  - *Summary:* ${c.summary ?? "N/A"}\n`;
  });
  md += `\n---\n\n`;

  // Part 1 table
  md += `### PART 1 – EVALUATION TABLE (DECISION SUMMARY)\n\n`;
  md += `| S. No | Category | Qualification | Pass (Yes/No) | Fail (Yes/No) | Request Additional Information (Yes/No) | Confidence Score (0.0–10.0) | Eligible for Certification |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;

  let overallFail = false;
  for (const c of adjusted.criteria ?? []) {
    const isPass = c.pass_fail === "Pass" ? "Yes" : "No";
    const isFail = c.pass_fail === "Fail" ? "Yes" : "No";
    const reqInfo = c.request_info ?? "No";
    if (isFail === "Yes") overallFail = true;
    const conf = Number.isFinite(c.confidence) ? Number(c.confidence).toFixed(1) : "10.0";
    md += `| ${c.s_no} | ${c.category} | ${c.qualification} | ${isPass} | ${isFail} | ${reqInfo} | ${conf} | N/A – criterion-level only |\n`;
  }

  const finalPass = overallFail ? "No" : "Yes";
  const finalFail = overallFail ? "Yes" : "No";
  const finalElig = adjusted.final_decision ?? "No";
  md += `| 8 | Final Decision | Meets all SED requirements under §26.67 | ${finalPass} | ${finalFail} | No | 10.0 | ${finalElig} |\n\n---\n\n`;

  // Part 2 table
  md += `### PART 2 – EXPLAINABLE AI TABLE (REASONING)\n\n`;
  md += `| S. No | Category | Qualification | What the Rule Requires | Summary of Applicant's Evidence | Reasoning (How Evidence Maps to Rule) | Decision Mapping (from Part 1) |\n`;
  md += `|---|---|---|---|---|---|---|\n`;
  for (const c of adjusted.criteria ?? []) {
    const isPass = c.pass_fail === "Pass" ? "Yes" : "No";
    const isFail = c.pass_fail === "Fail" ? "Yes" : "No";
    const reqInfo = c.request_info ?? "No";
    const conf = Number.isFinite(c.confidence) ? Number(c.confidence).toFixed(1) : "10.0";
    const decMap = `Pass = ${isPass}; Fail = ${isFail}; Req Info = ${reqInfo}; Conf = ${conf}`;
    md += `| ${c.s_no} | ${c.category} | ${c.qualification} | ${c.rule_requires ?? ""} | ${c.evidence_summary ?? ""} | ${c.reasoning ?? ""} | ${decMap} |\n`;
  }
  md += `\n---\n\n`;
  md += `### 📝 CERTIFIER COMMENTS & FINAL SUMMARY\n`;
  md += adjusted.certifier_comments ?? "No comments provided.";

  return md;
}
