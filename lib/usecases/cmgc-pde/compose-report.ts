import type { CmgcRunResult } from "./types";

export type ReportOverride = {
  question_id: string;
  oldValue: string;
  newValue: string;
  reason: string;
};

function fmt(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function composeCmgcReport(
  result: CmgcRunResult,
  overrides: readonly ReportOverride[] = [],
): string {
  const { evaluation, recommendation, multi_method } = result;
  const lines: string[] = [];

  lines.push(`# Project Delivery Evaluation`);
  if (evaluation.project_name) lines.push(`**Project:** ${evaluation.project_name}`);
  if (evaluation.evaluation_date) lines.push(`**Date:** ${evaluation.evaluation_date}`);
  lines.push(``);

  lines.push(`## Recommendation`);
  lines.push(``);
  lines.push(`**Recommended method:** ${recommendation.recommended_method ?? "—"}`);
  lines.push(`Composite score: ${fmt(recommendation.composite_score, 3)} / 3.000`);
  if (recommendation.runner_up_method) {
    lines.push(
      `Runner-up: ${recommendation.runner_up_method} (${fmt(recommendation.runner_up_score, 3)})`,
    );
  }
  if (recommendation.is_borderline) {
    lines.push(``);
    lines.push(`> ⚠ Borderline result — top two methods are within a narrow margin. Review the comparison below before finalizing.`);
  }
  lines.push(``);

  if (evaluation.summary?.trim()) {
    lines.push(`## Summary`);
    lines.push(``);
    lines.push(evaluation.summary.trim());
    lines.push(``);
  }

  if (recommendation.override_reasons?.length > 0) {
    lines.push(`## Rule-based overrides applied`);
    lines.push(``);
    for (const r of recommendation.override_reasons) {
      lines.push(`- ${r}`);
    }
    lines.push(``);
  }

  if (overrides.length > 0) {
    lines.push(`## Human overrides (HIFL)`);
    lines.push(``);
    lines.push(`| Question | Change | Reason |`);
    lines.push(`|---|---|---|`);
    for (const o of overrides) {
      const reason = (o.reason ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(`| ${o.question_id} | ${o.oldValue} → ${o.newValue} | ${reason} |`);
    }
    lines.push(``);
  }

  const top = multi_method.method_scores.slice(0, 3);
  if (top.length > 0) {
    lines.push(`## Top methods`);
    lines.push(``);
    lines.push(`| Rank | Method | Score | Status |`);
    lines.push(`|---|---|---|---|`);
    for (const m of top) {
      lines.push(
        `| ${m.rank} | ${m.method} | ${fmt(m.score, 3)} | ${m.blocked ? "Blocked" : "Eligible"} |`,
      );
    }
    lines.push(``);

    for (const m of top) {
      lines.push(`### ${m.rank}. ${m.method} — ${fmt(m.score, 3)}`);
      if (m.blocked && m.block_reasons.length > 0) {
        lines.push(``);
        lines.push(`*Blocked:* ${m.block_reasons.join("; ")}`);
      }
      if (m.pros.length > 0) {
        lines.push(``);
        lines.push(`**Pros:**`);
        for (const p of m.pros) lines.push(`- ${p}`);
      }
      if (m.cons.length > 0) {
        lines.push(``);
        lines.push(`**Cons:**`);
        for (const c of m.cons) lines.push(`- ${c}`);
      }
      lines.push(``);
    }
  }

  const sectionEntries = Object.entries(recommendation.section_scores ?? {});
  if (sectionEntries.length > 0) {
    lines.push(`## Section scores`);
    lines.push(``);
    lines.push(`| Section | Score |`);
    lines.push(`|---|---|`);
    for (const [sec, score] of sectionEntries) {
      lines.push(`| ${sec} | ${fmt(score as number, 2)} / 3.00 |`);
    }
    lines.push(``);
  }

  return lines.join("\n").trim();
}
