"use client";
import { useState } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { CmgcRubricEdit } from "./cmgc-rubric-edit";
import { CucpRubricEdit } from "./cucp-rubric-edit";
import { RowRubricEdit } from "./row-rubric-edit";
import { EditTabContent } from "./edit-tab-content";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { RowRubricData } from "@/lib/usecases/row-appraisal/rubric-data";
import type { RubricsManifestEntry } from "@/lib/usecases/rubrics-store";

type TabValue = "cmgc-pde" | "row-appraisal" | "cucp-reevals";

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

export function EditRubricTabs({
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

  // Controlled value + per-panel conditional render so the inactive editor
  // unmounts on tab switch. That throws away the leaving editor's local
  // draft state (questions/weights/etc.) — same effect as a page leave.
  const [active, setActive] = useState<TabValue>("cmgc-pde");

  return (
    <Tabs.Root
      value={active}
      onValueChange={(v) => setActive(v as TabValue)}
    >
      <Tabs.List className="mb-6 flex items-stretch gap-0 border-b border-[var(--color-line)]">
        <TabButton value="cmgc-pde" label="Validate Project" count={cmgcCount} />
        <TabButton value="row-appraisal" label="Validate Appraisal" count={rowCount} />
        <TabButton value="cucp-reevals" label="Validate Narrative" count={cucpCount} />
      </Tabs.List>

      <Tabs.Panel value="cmgc-pde" className="space-y-6">
        {active === "cmgc-pde" && (
          <EditTabContent
            usecaseId="cmgc-pde"
            initialRubrics={cmgcRubrics}
            initialData={cmgc}
            EditComponent={CmgcRubricEdit}
          />
        )}
      </Tabs.Panel>
      <Tabs.Panel value="row-appraisal" className="space-y-6">
        {active === "row-appraisal" && (
          <EditTabContent
            usecaseId="row-appraisal"
            initialRubrics={rowRubrics}
            initialData={row}
            EditComponent={RowRubricEdit}
          />
        )}
      </Tabs.Panel>
      <Tabs.Panel value="cucp-reevals" className="space-y-6">
        {active === "cucp-reevals" && (
          <EditTabContent
            usecaseId="cucp-reevals"
            initialRubrics={cucpRubrics}
            initialData={cucp}
            EditComponent={CucpRubricEdit}
          />
        )}
      </Tabs.Panel>
    </Tabs.Root>
  );
}
