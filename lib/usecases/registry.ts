import type { UseCase } from "./types";
import { cmgcPde } from "./cmgc-pde/definition";
import { cucpReevals } from "./cucp-reevals/definition";
import { rowAppraisal } from "./row-appraisal/definition";

export const USE_CASES = { cmgcPde, cucpReevals, rowAppraisal } as const;

const ALL: UseCase[] = Object.values(USE_CASES) as UseCase[];

export function getUseCase(id: string): UseCase | undefined {
  return ALL.find((u) => u.id === id);
}

export const USE_CASES_BY_TILE: Record<"review" | "search" | "draft" | "inbox", UseCase[]> = {
  review: ALL.filter((u) => u.tile === "review"),
  search: [],
  draft: [],
  inbox: [],
};
