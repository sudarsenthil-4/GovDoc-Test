import { SECTION_WEIGHTS } from "../rubric";

const SECTION_NAMES: Record<string, string> = {
  A: "Project Scope & Characteristics",
  B: "Schedule Issues",
  C: "Opportunity for Innovation",
  D: "Quality Enhancement",
  E: "Cost Issues",
  F: "Staffing Issues",
};

/**
 * Build a qualitative comparison for borderline cases.
 * Ported from legacy _build_comparison (lines 1343-1417).
 */
export function buildComparisonText(args: {
  recommended: string;
  runnerUp: string | null;
  composite: number;
  sectionScores: Record<string, number>;
  recommendedScore?: number;
  runnerUpScore?: number | null;
}): string {
  const { recommended, runnerUp, composite, sectionScores, recommendedScore, runnerUpScore } = args;

  // Header
  const lines: string[] = [
    `**Project Composite Score: ${composite.toFixed(2)} / 3.00**`,
    "",
    `The overall score places this project near the boundary between **${recommended}** and **${runnerUp ?? "N/A"}**.`,
  ];

  // Method suitability comparison (affinity scores, 0-1 scale)
  if (recommendedScore != null || runnerUpScore != null) {
    lines.push("");
    lines.push("**Method Suitability (0 – 1 scale, higher = better fit):**");
    if (recommendedScore != null) {
      const bar = Math.round(recommendedScore * 10);
      const filled = "█".repeat(bar) + "░".repeat(10 - bar);
      lines.push(`- **${recommended}**: ${recommendedScore.toFixed(4)}  \`${filled}\``);
    }
    if (runnerUp && runnerUpScore != null) {
      const bar = Math.round(runnerUpScore * 10);
      const filled = "█".repeat(bar) + "░".repeat(10 - bar);
      lines.push(`- **${runnerUp}**: ${runnerUpScore.toFixed(4)}  \`${filled}\``);
    }
    if (recommendedScore != null && runnerUpScore != null) {
      const gap = recommendedScore - runnerUpScore;
      lines.push(`- Score gap: **${gap >= 0 ? "+" : ""}${gap.toFixed(4)}** — ${Math.abs(gap) < 0.02 ? "very close" : "close"}`);
    }
  }

  // Section-level breakdown
  lines.push("");
  lines.push("**Section Scores (rubric 1–3 scale, weight applied to composite):**");
  for (const [sec, name] of Object.entries(SECTION_NAMES)) {
    const score = sectionScores[sec] ?? 2.0;
    const weight = SECTION_WEIGHTS[sec as "A" | "B" | "C" | "D" | "E" | "F"] ?? 0;
    lines.push(`- ${name}: ${score.toFixed(2)} / 3.00 (weight: ${Math.round(weight * 100)}%)`);
  }

  // Closing guidance
  lines.push("");
  lines.push(
    `**${recommended}** is the primary recommendation, but **${runnerUp ?? "N/A"}** scores ` +
      `competitively close. Consider district experience with each method, ` +
      `stakeholder preferences, and any project constraints not captured in the rubric ` +
      `before making the final decision.`,
  );

  return lines.join("\n");
}
