"use client";
import { useEffect, useState } from "react";
import type { UseCaseId } from "@/lib/usecases/types";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { RowRubricData } from "@/lib/usecases/row-appraisal/rubric-data";
import { CmgcRubricView } from "./cmgc-rubric-view";
import { CucpRubricView } from "./cucp-rubric-view";
import { RowRubricView } from "./row-rubric-view";

type Data = CmgcRubricData | CucpRubricData | RowRubricData;

export function RubricPreviewSlideDown({ usecaseId }: { usecaseId: UseCaseId }) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/usecases/${usecaseId}/rubric`)
      .then((res) => (res.ok ? res.json() : null))
      .then((next: Data | null) => {
        if (alive && next) setData(next);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [usecaseId]);

  return (
    <details className="group rounded-md border border-[var(--color-line)] bg-[var(--color-paper)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-cream-soft)]">
        <span>Preview rubric</span>
        <span
          aria-hidden="true"
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] group-open:hidden"
        >
          Show
        </span>
        <span
          aria-hidden="true"
          className="hidden font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] group-open:inline"
        >
          Hide
        </span>
      </summary>
      <div className="border-t border-[var(--color-line)] px-4 py-4">
        {data ? (
          renderView(usecaseId, data)
        ) : (
          <p className="text-xs text-[var(--color-ink-mute)]">Loading rubric…</p>
        )}
      </div>
    </details>
  );
}

function renderView(usecaseId: UseCaseId, data: Data): React.JSX.Element {
  switch (usecaseId) {
    case "cmgc-pde":
      return <CmgcRubricView data={data as CmgcRubricData} compact />;
    case "cucp-reevals":
      return <CucpRubricView data={data as CucpRubricData} compact />;
    case "row-appraisal":
      return <RowRubricView data={data as RowRubricData} compact />;
  }
}
