"use client";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import { defaultCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { RubricQuestion } from "@/lib/usecases/cmgc-pde/rubric";
import { RubricShell } from "./shared/rubric-shell";
import { RubricSection } from "./shared/rubric-section";

const SECTION_KEYS = ["A", "B", "C", "D", "E", "F"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

// Strip the "A: " / "B: " prefix that lives in the data model so section
// headers read as names only — matches ROW's category-name convention and
// CUCP's named groupings. Data IDs (A1, A2, B1…) on each question are
// unaffected; they stay as the canonical identifiers.
function sectionNameOnly(label: string): string {
  const m = label.match(/^[A-Z]:\s*(.+)$/);
  return m?.[1] ?? label;
}

const DESCRIPTION =
  "Validate Project rubric — six sections, each scored on a 3-tier A/B/C scale. Section weights combine into a weighted composite recommendation across eight delivery methods.";

export function CmgcRubricView({
  data,
  compact = false,
  headerRight,
}: {
  data?: CmgcRubricData;
  compact?: boolean;
  headerRight?: React.ReactNode;
}) {
  const { questions, weights } = data ?? defaultCmgcRubric();

  const bySection = new Map<SectionKey, { name: string; qs: RubricQuestion[] }>();
  for (const q of questions) {
    const key = (q.section.match(/^([A-Z]):/)?.[1] ?? q.section.charAt(0)) as SectionKey;
    const name = sectionNameOnly(q.section);
    const cur = bySection.get(key) ?? { name, qs: [] };
    cur.qs.push(q);
    bySection.set(key, cur);
  }
  const sections = SECTION_KEYS.map((k) => ({
    key: k,
    name: bySection.get(k)?.name ?? k,
    qs: bySection.get(k)?.qs ?? [],
    weight: weights[k],
  }));

  return (
    <RubricShell description={DESCRIPTION} headerRight={headerRight}>
      {sections.map((s, i) => (
        <RubricSection
          key={s.key}
          title={s.name}
          count={s.qs.length}
          countLabel="question"
          weight={s.weight}
          defaultOpen={i === 0}
          compact={compact}
        >
          <ol className="flex list-none flex-col gap-4">
            {s.qs.map((q, qi) => (
              <li key={q.id} className="border-b border-[var(--color-line-soft)] py-3 last:border-b-0">
                <div className="grid grid-cols-[auto_1fr] items-baseline gap-3.5 text-[13.5px] leading-[1.5] text-[var(--color-ink-soft)]">
                  <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
                    {qi + 1}.
                  </span>
                  <span className="font-medium">{q.question}</span>
                </div>
                <dl className="mt-2.5 ml-[42px] flex flex-col gap-1.5">
                  <RatingRow letter="A" text={q.option_a} />
                  <RatingRow letter="B" text={q.option_b} />
                  <RatingRow letter="C" text={q.option_c} />
                </dl>
              </li>
            ))}
          </ol>
        </RubricSection>
      ))}
    </RubricShell>
  );
}

function RatingRow({ letter, text }: { letter: "A" | "B" | "C"; text: string }) {
  return (
    <div className="grid grid-cols-[24px_1fr] items-baseline gap-2.5">
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
        {letter}.
      </span>
      <span className="text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">{text}</span>
    </div>
  );
}
