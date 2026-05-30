"use client";
import { Tabs } from "@base-ui/react/tabs";
import { CmgcRubricView } from "./cmgc-rubric-view";
import { CucpRubricView } from "./cucp-rubric-view";
import { RowRubricView } from "./row-rubric-view";
import { PreviewTabContent } from "./preview-tab-content";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { RowRubricData } from "@/lib/usecases/row-appraisal/rubric-data";
import type { RubricsManifestEntry } from "@/lib/usecases/rubrics-store";

type Props = {
  cmgc: CmgcRubricData;
  cucp: CucpRubricData;
  row: RowRubricData;
  cmgcRubrics: readonly RubricsManifestEntry[];
  cucpRubrics: readonly RubricsManifestEntry[];
  rowRubrics: readonly RubricsManifestEntry[];
};

const TAB_BASE =
  "inline-flex items-center gap-2.5 border-b-2 border-transparent bg-transparent px-[22px] py-3.5 text-[13.5px] font-medium tracking-[-0.005em] text-[var(--color-ink-mute)] -mb-px transition-colors hover:bg-[var(--color-cream-soft)] hover:text-[var(--color-ink)] data-[selected=true]:border-[var(--color-govdoc-primary)] data-[selected=true]:font-semibold data-[selected=true]:text-[var(--color-ink)]";

const COUNT_CHIP =
  "border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-1.5 py-0.5 font-mono text-[10px] tracking-[0.08em] text-[var(--color-ink-faint)]";

const COUNT_CHIP_ACTIVE =
  "border-[var(--color-govdoc-primary)] bg-[var(--color-accent-soft)] text-[var(--color-govdoc-primary)]";

function TabButton({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count: number;
}) {
  return (
    <Tabs.Tab
      value={value}
      className={TAB_BASE}
      render={(props, state) => (
        <button {...props} data-selected={state.active ? "true" : undefined}>
          <span>{label}</span>
          <span className={`${COUNT_CHIP} ${state.active ? COUNT_CHIP_ACTIVE : ""}`}>
            {count}
          </span>
        </button>
      )}
    />
  );
}

export function PreviewRubricTabs({
  cmgc,
  cucp,
  row,
  cmgcRubrics,
  cucpRubrics,
  rowRubrics,
}: Props) {
  const cmgcCount = cmgc.questions.length;
  const cucpCount = cucp.l2.length + cucp.l3.length;
  const rowCount = Object.keys(row).length;

  return (
    <Tabs.Root defaultValue="cmgc-pde">
      <Tabs.List className="mb-6 flex items-stretch gap-0 border-b border-[var(--color-line)]">
        <TabButton value="cmgc-pde" label="Validate Project" count={cmgcCount} />
        <TabButton value="row-appraisal" label="Validate Appraisal" count={rowCount} />
        <TabButton value="cucp-reevals" label="Validate Narrative" count={cucpCount} />
      </Tabs.List>

      <Tabs.Panel value="cmgc-pde" className="space-y-6">
        <PreviewTabContent
          usecaseId="cmgc-pde"
          rubrics={cmgcRubrics}
          initialData={cmgc}
          View={CmgcRubricView}
        />
      </Tabs.Panel>
      <Tabs.Panel value="row-appraisal" className="space-y-6">
        <PreviewTabContent
          usecaseId="row-appraisal"
          rubrics={rowRubrics}
          initialData={row}
          View={RowRubricView}
        />
      </Tabs.Panel>
      <Tabs.Panel value="cucp-reevals" className="space-y-6">
        <PreviewTabContent
          usecaseId="cucp-reevals"
          rubrics={cucpRubrics}
          initialData={cucp}
          View={CucpRubricView}
        />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
