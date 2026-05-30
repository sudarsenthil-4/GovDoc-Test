import { WorkBreadcrumbs } from "@/components/work/page-shell";
import { PreviewRubricTabs } from "@/components/work/rubric/preview-tabs";
import { loadCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { loadCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { loadRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";
import { listRubrics } from "@/lib/usecases/rubrics-store";

export const dynamic = "force-dynamic";

export default async function PreviewRubricsPage() {
  const [cmgc, cucp, row, cmgcRubrics, cucpRubrics, rowRubrics] = await Promise.all([
    loadCmgcRubric(),
    loadCucpRubric(),
    loadRowRubric(),
    listRubrics("cmgc-pde"),
    listRubrics("cucp-reevals"),
    listRubrics("row-appraisal"),
  ]);

  return (
    <div>
      <WorkBreadcrumbs
        crumbs={[
          { label: "Workspace", href: "/workspace" },
          { label: "Search & Ask", href: "/work/search" },
          { label: "Rubric Tools", href: "/work/search" },
          { label: "Review Rubrics" },
        ]}
      />

      {/* Page header — bespoke (we need the read-only meta column on the right). */}
      <header className="mb-7 grid grid-cols-[auto_1fr] items-start gap-6 border-b border-[var(--color-line)] pb-6 lg:grid-cols-[auto_1fr_auto]">
        <div className="flex size-11 shrink-0 items-center justify-center bg-[var(--color-govdoc-primary)] text-white">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="square"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M3 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z" />
            <path d="M21 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z" />
          </svg>
        </div>
        <div className="space-y-2.5">
          <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
            Rubric · Preview
          </div>
          <h1
            className="leading-none tracking-[-0.025em] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(32px, 3.6vw, 44px)",
              fontVariationSettings: '"opsz" 96',
            }}
          >
            Review{" "}
            <em
              className="text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              Rubrics
            </em>
          </h1>
          <p className="max-w-[56ch] text-[14px] leading-[1.5] text-[var(--color-ink-mute)]">
            Read-only preview of the criteria the AI applies for each review type.
          </p>
        </div>
        <div className="col-span-full flex flex-col items-start gap-1.5 pt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] lg:col-span-1 lg:items-end lg:pt-2">
          <span className="inline-flex items-center gap-1.5 border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1 text-[var(--color-ink-soft)]">
            <span className="size-[5px] rounded-full bg-[#2d8c4a]" /> Read-Only
          </span>
          <span>
            Version <strong className="font-medium text-[var(--color-ink)]">1.0.0</strong>
          </span>
          <span>
            Updated <strong className="font-medium text-[var(--color-ink)]">09 May 2026</strong>
          </span>
        </div>
      </header>

      <PreviewRubricTabs
        cmgc={cmgc}
        cucp={cucp}
        row={row}
        cmgcRubrics={cmgcRubrics}
        cucpRubrics={cucpRubrics}
        rowRubrics={rowRubrics}
      />
    </div>
  );
}
