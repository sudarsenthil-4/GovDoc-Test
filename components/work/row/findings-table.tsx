"use client";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";
import rubricSchema from "@/lib/usecases/row-appraisal/assets/rubric_schema.json";
import { STATUS_TONE } from "./status-tone";

type RuleStatus = "Pass" | "Fail" | "N/A";

type Finding = {
  category: string;
  scoreLevel: string;
  rule: string;
  ruleScore: "0" | "1" | "N/A";
  status: RuleStatus;
  evidence: string;
  comments: string;
};

function buildFindings(results: EvaluationResult[]): Finding[] {
  const out: Finding[] = [];
  const schema = rubricSchema as Record<string, Record<string, string>>;

  for (const r of results) {
    const rules = schema[r.category];
    if (!rules) continue;

    const sortedLevels = Object.keys(rules)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b));

    for (const level of sortedLevels) {
      const rule = rules[level];
      if (!rule) continue;
      const levelInt = Number(level);

      if (r.score === -1) {
        out.push({
          category: r.category,
          scoreLevel: `Score ${level}`,
          rule,
          ruleScore: "N/A",
          status: "N/A",
          evidence: "Not applicable for this document",
          comments: r.comments,
        });
      } else if (r.score >= levelInt) {
        const exact = r.score === levelInt;
        out.push({
          category: r.category,
          scoreLevel: `Score ${level}`,
          rule,
          ruleScore: "1",
          status: "Pass",
          evidence: exact
            ? r.evidence
            : `Score ${r.score} achieved, which satisfies Score ${level} requirement`,
          comments: exact
            ? r.comments
            : `This rule is satisfied because the achieved score (${r.score}) is higher than ${level}`,
        });
      } else {
        out.push({
          category: r.category,
          scoreLevel: `Score ${level}`,
          rule,
          ruleScore: "0",
          status: "Fail",
          evidence: `Score ${r.score} achieved, which does not meet Score ${level} requirement`,
          comments: `This rule requires Score ${level} but only Score ${r.score} was achieved`,
        });
      }
    }
  }
  return out;
}

export function FindingsTable({ results }: { results: EvaluationResult[] }) {
  const findings = buildFindings(results);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 bg-background border-b">
          <tr>
            <th className="text-left p-2">Category</th>
            <th className="text-left p-2">Score Level</th>
            <th className="text-left p-2">Rubric Rule</th>
            <th className="text-left p-2">Met</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f, i) => (
            <tr key={`${f.category}-${f.scoreLevel}-${i}`} className="border-b align-top">
              <td className="p-2 font-medium">{f.category}</td>
              <td className="p-2 whitespace-nowrap">{f.scoreLevel}</td>
              <td className="p-2 max-w-md break-words">{f.rule}</td>
              <td className="p-2 text-center font-mono">{f.ruleScore}</td>
              <td className="p-2">
                <span
                  data-rule-status={f.status}
                  className={`px-2 py-1 rounded text-xs font-medium ${STATUS_TONE[f.status].cell}`}
                >
                  {f.status}
                </span>
              </td>
              <td className="p-2 max-w-md break-words">{f.evidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
