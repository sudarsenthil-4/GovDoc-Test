import type { UseCaseId } from "@/lib/usecases/types";
import { CmgcRubricView } from "./cmgc-rubric-view";
import { CucpRubricView } from "./cucp-rubric-view";
import { RowRubricView } from "./row-rubric-view";

export function RubricView({ usecaseId }: { usecaseId: UseCaseId }) {
  switch (usecaseId) {
    case "cmgc-pde":
      return <CmgcRubricView />;
    case "cucp-reevals":
      return <CucpRubricView />;
    case "row-appraisal":
      return <RowRubricView />;
  }
}
