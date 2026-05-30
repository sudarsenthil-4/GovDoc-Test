"use client";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import { defaultCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { CucpL3Criterion } from "@/lib/usecases/cucp-reevals/rubric";
import { RubricShell } from "./shared/rubric-shell";
import { RubricSection } from "./shared/rubric-section";

const DESCRIPTION =
  "Validate Narrative — three Mandatory Eligibility Requirements followed by four Scored Evaluation Criteria. Each criterion is judged YES or NO.";

export function CucpRubricView({
  data,
  compact = false,
  headerRight,
}: {
  data?: CucpRubricData;
  compact?: boolean;
  headerRight?: React.ReactNode;
}) {
  const { l3 } = data ?? defaultCucpRubric();
  const mandatory = l3.filter((c) => c.s_no <= 3);
  const evaluation = l3.filter((c) => c.s_no >= 4);

  return (
    <RubricShell description={DESCRIPTION} headerRight={headerRight}>
      <RubricSection
        title="Mandatory Eligibility Requirements"
        count={mandatory.length}
        countLabel="criterion"
        defaultOpen
        compact={compact}
      >
        <ol className="flex list-none flex-col">
          {mandatory.map((c) => (
            <CriterionItem key={c.s_no} criterion={c} />
          ))}
        </ol>
      </RubricSection>

      <RubricSection
        title="Scored Evaluation Criteria"
        count={evaluation.length}
        countLabel="criterion"
        compact={compact}
      >
        <ol className="flex list-none flex-col">
          {evaluation.map((c, i) => (
            <CriterionItem key={c.s_no} criterion={c} displayNumber={i + 1} />
          ))}
        </ol>
      </RubricSection>
    </RubricShell>
  );
}

function CriterionItem({
  criterion: c,
  displayNumber,
}: {
  criterion: CucpL3Criterion;
  displayNumber?: number;
}) {
  const heading = c.title ?? c.name;
  const marker = displayNumber !== undefined ? `${displayNumber}.` : `${c.s_no}.`;
  return (
    <li className="border-b border-[var(--color-line-soft)] py-3 last:border-b-0">
      <div className="grid grid-cols-[28px_1fr] items-baseline gap-3.5">
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
          {marker}
        </span>
        <span className="text-[13.5px] font-medium leading-[1.5] text-[var(--color-ink)]">{heading}</span>
      </div>
      {c.rule && (
        <p className="mt-2 ml-[42px] text-[12px] italic leading-[1.5] text-[var(--color-ink-mute)]">
          <span className="font-semibold not-italic text-[var(--color-ink-soft)]">Rule:</span> {c.rule}
        </p>
      )}
      <dl className="mt-2.5 ml-[42px] flex flex-col gap-1.5">
        <YesNoRow label="YES" text={c.pass} />
        <YesNoRow label="NO" text={c.fail} />
      </dl>
    </li>
  );
}

function YesNoRow({ label, text }: { label: string; text: string | undefined }) {
  return (
    <div className="grid grid-cols-[32px_1fr] items-baseline gap-2.5">
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
        {label}
      </span>
      <dd className="break-words text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">{text ?? "—"}</dd>
    </div>
  );
}
