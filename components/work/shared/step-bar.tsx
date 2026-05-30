"use client";

import { cn } from "@/lib/utils";

export type StepBarStep = { id: string; label: string };

export function StepBar({
  steps,
  currentId,
  approvedIds,
  onJump,
}: {
  steps: readonly StepBarStep[];
  currentId: string;
  approvedIds: readonly string[];
  onJump: (id: string) => void;
}) {
  const approved = new Set(approvedIds);
  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex items-center gap-2">
        {steps.map((s, i) => {
          const isCurrent = s.id === currentId;
          const isApproved = approved.has(s.id);
          const enabled = isCurrent || isApproved;
          return (
            <li
              key={s.id}
              aria-current={isCurrent ? "step" : undefined}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                disabled={!enabled}
                onClick={() => onJump(s.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCurrent && isApproved && "bg-muted text-foreground hover:bg-muted/80",
                  !isCurrent && !isApproved && "bg-card text-muted-foreground",
                )}
              >
                <span className="mr-1">{i + 1}</span>
                {s.label}
              </button>
              {i < steps.length - 1 ? <span className="text-muted-foreground">→</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
