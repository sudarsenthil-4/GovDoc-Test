import { Edit3 } from "lucide-react";
import { WorkBreadcrumbs, WorkPageHeader } from "@/components/work/page-shell";
import { EditRubricTabs } from "@/components/work/rubric/edit-tabs";
import { loadCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { loadCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { loadRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";
import { listRubrics } from "@/lib/usecases/rubrics-store";

export const dynamic = "force-dynamic";

export default async function EditRubricsPage() {
  const [cmgc, cucp, row, cmgcRubrics, cucpRubrics, rowRubrics] = await Promise.all([
    loadCmgcRubric(),
    loadCucpRubric(),
    loadRowRubric(),
    listRubrics("cmgc-pde"),
    listRubrics("cucp-reevals"),
    listRubrics("row-appraisal"),
  ]);

  return (
    <div className="space-y-6">
      <WorkBreadcrumbs
        crumbs={[
          { label: "Workspace", href: "/workspace" },
          { label: "Search & Ask", href: "/work/search" },
          { label: "Edit Rubrics" },
        ]}
      />

      <WorkPageHeader
        icon={Edit3}
        eyebrow="Rubric"
        title="Edit rubrics"
        blurb="Adjust questions, options, and weights. Saved edits show up immediately in Review Rubrics."
      />

      <EditRubricTabs
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
