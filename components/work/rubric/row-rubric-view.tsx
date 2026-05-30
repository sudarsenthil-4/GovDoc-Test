import type { RowRubricData } from "@/lib/usecases/row-appraisal/rubric-data";
import { defaultRowRubric } from "@/lib/usecases/row-appraisal/rubric-data";
import { RubricShell } from "./shared/rubric-shell";
import { RubricSection } from "./shared/rubric-section";

const TIERS: ("1" | "2" | "3" | "4" | "5")[] = ["1", "2", "3", "4", "5"];

const DESCRIPTION =
  "Validate Appraisal — 34 categories, each rated on a 1–5 scale against the descriptors below. Per-category scores combine into the overall evaluation.";

export function RowRubricView({
  data,
  compact = false,
  headerRight,
}: {
  data?: RowRubricData;
  compact?: boolean;
  headerRight?: React.ReactNode;
}) {
  const schema = data ?? defaultRowRubric();
  const categories = Object.entries(schema);

  return (
    <RubricShell description={DESCRIPTION} headerRight={headerRight}>
      {categories.map(([category, tiers]) => (
        <RubricSection key={category} title={category} count={TIERS.length} countLabel="tier" compact={compact}>
          <dl className="flex flex-col gap-1.5">
            {TIERS.map((tier) => (
              <TierRow key={tier} tier={tier} text={tiers[tier]} />
            ))}
          </dl>
        </RubricSection>
      ))}
    </RubricShell>
  );
}

function TierRow({ tier, text }: { tier: "1" | "2" | "3" | "4" | "5"; text: string }) {
  return (
    <div className="grid grid-cols-[24px_1fr] items-baseline gap-2.5">
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
        {tier}.
      </span>
      <span className="text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">{text || "—"}</span>
    </div>
  );
}
