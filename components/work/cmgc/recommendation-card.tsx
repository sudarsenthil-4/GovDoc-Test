import type { RecommendationResult } from "@/lib/usecases/cmgc-pde/types";

type Props = { recommendation: RecommendationResult };

const SECTION_LABELS: Record<string, string> = {
  A: "Project Scope & Characteristics",
  B: "Schedule Issues",
  C: "Opportunity for Innovation",
  D: "Quality Enhancement",
  E: "Cost Issues",
  F: "Staffing Issues",
};

function sectionLabel(key: string): string {
  return SECTION_LABELS[key] ? `${key}. ${SECTION_LABELS[key]}` : key;
}

export function RecommendationCard({ recommendation }: Props) {
  const sectionEntries = Object.entries(recommendation.section_scores ?? {}).sort(
    ([a], [b]) => a.localeCompare(b),
  );

  return (
    <div className="space-y-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
      <div className="space-y-1">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          Recommended delivery method
        </p>
        <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
          {recommendation.recommended_method || "—"}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-2 py-1 font-medium text-[var(--color-ink)]">
          Composite {recommendation.composite_score.toFixed(3)} / 3.000
        </span>
        {recommendation.is_borderline && (
          <span
            data-testid="borderline-chip"
            className="rounded-md border border-[var(--color-govdoc-primary)] bg-[var(--color-accent-soft)] px-2 py-1 font-medium text-[var(--color-govdoc-primary)]"
          >
            Borderline
          </span>
        )}
        {recommendation.runner_up_method && (
          <span className="text-[var(--color-ink-mute)]">
            Runner-up:{" "}
            <span className="font-medium text-[var(--color-ink)]">
              {recommendation.runner_up_method}
            </span>
            {recommendation.runner_up_score != null && (
              <> ({recommendation.runner_up_score.toFixed(3)})</>
            )}
          </span>
        )}
      </div>

      {recommendation.override_reasons.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
            Override reasons
          </h3>
          <ul className="list-disc pl-5 text-sm text-[var(--color-ink-soft)]">
            {recommendation.override_reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {sectionEntries.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
            Section scores
          </h3>
          <div className="overflow-x-auto rounded-md border border-[var(--color-line)]">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--color-cream-soft)] text-[11px] uppercase tracking-wider text-[var(--color-ink-faint)]">
                <tr>
                  <th className="text-left p-2">Section</th>
                  <th className="text-right p-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {sectionEntries.map(([key, score]) => (
                  <tr key={key} className="border-t border-[var(--color-line)]">
                    <td className="p-2">{sectionLabel(key)}</td>
                    <td className="p-2 text-right font-medium">
                      {Number(score).toFixed(2)} / 3.00
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
