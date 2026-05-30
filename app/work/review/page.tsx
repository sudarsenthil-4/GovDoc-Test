import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, HardHat, MapPin } from "lucide-react";
import { USE_CASES_BY_TILE } from "@/lib/usecases/registry";
import type { UseCaseId } from "@/lib/usecases/types";
import { WorkBreadcrumbs, WorkPageHeader } from "@/components/work/page-shell";
import { USE_CASE_FAMILY } from "@/components/work/use-case-tone";

const ICONS: Record<UseCaseId, typeof HardHat> = {
  "cmgc-pde": HardHat,
  "cucp-reevals": BadgeCheck,
  "row-appraisal": MapPin,
};

export default function ReviewPicker() {
  const cases = USE_CASES_BY_TILE.review;
  return (
    <div className="space-y-6">
      <WorkBreadcrumbs
        crumbs={[
          { label: "Workspace", href: "/workspace" },
          { label: "Validate Documents" },
        ]}
      />

      <WorkPageHeader
        icon={CheckCircle2}
        eyebrow="Validate & Comply"
        title="Validate"
        accent="Documents"
        blurb="Score, redline, and approve customer-submitted documents against the applicable rubric."
      />

      {cases.length === 0 ? (
        <div className="border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-12 text-center text-[13px] text-[var(--color-ink-mute)]">
          No evaluators registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cases.map((uc, i) => {
            const Icon = ICONS[uc.id as UseCaseId] ?? CheckCircle2;
            const num = String(i + 1).padStart(2, "0");
            const family = USE_CASE_FAMILY[uc.id as UseCaseId] ?? "Review";
            return (
              <Link
                key={uc.id}
                href={`/work/review/${uc.id}` as any}
                className="group flex h-full flex-col border border-[var(--color-line)] bg-[var(--color-paper)] px-7 pb-6 pt-7 text-inherit no-underline transition-all hover:-translate-y-0.5 hover:border-[var(--color-ink-soft)] hover:bg-[var(--color-cream-soft)]"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex size-9 items-center justify-center bg-[var(--color-ink)] text-white">
                    <Icon className="size-[18px]" strokeWidth={1.6} />
                  </div>
                  <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-[var(--color-ink-faint)]">
                    {num}
                  </span>
                </div>
                <h3
                  className="mb-2 leading-[1.15] tracking-[-0.015em] text-[var(--color-ink)]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 22,
                    fontVariationSettings: '"opsz" 96',
                  }}
                >
                  {uc.label}
                </h3>
                <p className="mb-6 flex-1 text-[13.5px] leading-[1.5] text-[var(--color-ink-mute)]">
                  {uc.blurb}
                </p>
                <div className="flex items-center justify-between border-t border-[var(--color-line-soft)] pt-4">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-govdoc-primary)]">
                    {family} · Live
                  </span>
                  <span className="flex size-7 items-center justify-center rounded-full border border-dotted border-[var(--color-ink-soft)] bg-[var(--color-cream)] text-[var(--color-ink-soft)] transition-all group-hover:translate-x-1 group-hover:border-white group-hover:bg-[var(--color-govdoc-primary)] group-hover:text-white">
                    <ArrowRight className="size-3" strokeWidth={1.6} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
