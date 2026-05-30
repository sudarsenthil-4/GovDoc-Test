"use client";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { StepBar, type StepBarStep } from "../shared/step-bar";
import { L1FactsTable } from "./l1-facts-table";
import {
  L2ClassificationsTable,
  type L2Row,
  type L2OverridePayload,
} from "./l2-classifications-table";
import { L2OverrideForm } from "./l2-override-form";
import { L3CriteriaTable } from "./l3-criteria-table";
import { L3OverrideForm, type L3OverridePayload } from "./l3-override-form";
import { L1OverrideForm } from "./l1-override-form";
import { RequestInfoBanner } from "./request-info-banner";
import type { ExtractedFact, Criterion, L1Override } from "@/lib/usecases/cucp-reevals/types";

type StepId = "l1" | "l2" | "l3" | "done";

const STEPS: readonly StepBarStep[] = [
  { id: "l1", label: "Facts (W5)" },
  { id: "l2", label: "Legal Categories" },
  { id: "l3", label: "Criteria" },
  { id: "done", label: "Done" },
];

const PRIMARY_BTN_CLASS = cn(
  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
  "bg-primary text-primary-foreground hover:bg-primary/90",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

const SECONDARY_BTN_CLASS = cn(
  "rounded-md border border-border bg-background px-3 py-2 text-sm",
  "transition-colors hover:bg-muted",
);

const RUNNING_LEVEL_LABEL: Record<1 | 2 | 3, string> = {
  1: "Level 1 — Facts (W5)",
  2: "Level 2 — Legal Categories",
  3: "Level 3 — Criteria",
};

function ReEvaluatingBanner({ level }: { level: 1 | 2 | 3 }): React.JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">
          Re-evaluating {RUNNING_LEVEL_LABEL[level]}…
        </div>
        <div className="text-xs text-muted-foreground">
          GovDoc is re-running this pass with your latest input. The table will update when it finishes.
        </div>
      </div>
    </div>
  );
}

export function CucpStepper({
  runId,
  projectId,
  facts,
  classifications,
  criteria,
  isReRunning,
  runningLevel,
  onComplete,
}: {
  runId: string;
  projectId: string;
  facts: readonly ExtractedFact[];
  classifications: readonly L2Row[];
  criteria: readonly Criterion[];
  isReRunning: boolean;
  runningLevel: 1 | 2 | 3 | null;
  onComplete: () => void;
}): React.JSX.Element {
  const [step, setStep] = useState<StepId>("l1");
  const [l1Approved, setL1Approved] = useState(false);
  const [l2Approved, setL2Approved] = useState(false);
  const [persistentCounts, setPersistentCounts] = useState({ l1: 0, l2: 0, l3: 0 });
  const [stagedCounts, setStagedCounts] = useState({ l1: 0, l2: 0, l3: 0 });
  const [actionError, setActionError] = useState<string | null>(null);

  async function postJson(url: string, body?: unknown): Promise<Response | null> {
    setActionError(null);
    const res = await fetch(url, {
      method: "POST",
      ...(body !== undefined && {
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")) || res.statusText;
      setActionError(`Request failed (${res.status}): ${detail}`);
      return null;
    }
    return res;
  }

  // Fetch persistent precedent counts at mount
  useEffect(() => {
    let alive = true;
    fetch(`/api/usecases/cucp-reevals/projects/${encodeURIComponent(projectId)}/precedents`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (db: {
          level_1_precedents?: unknown[];
          level_2_precedents?: unknown[];
          level_3_precedents?: unknown[];
        } | null) => {
          if (!alive || !db) return;
          setPersistentCounts({
            l1: (db.level_1_precedents ?? []).length,
            l2: (db.level_2_precedents ?? []).length,
            l3: (db.level_3_precedents ?? []).length,
          });
        },
      )
      .catch(() => {
        /* leave at 0 */
      });
    return () => {
      alive = false;
    };
  }, [projectId]);

  // request_info=Yes flips final_decision per caltrans cucp_reevals.py:207.
  // Without client-side staged overrides, this is purely a function of the
  // latest criteria prop — the LLM stamps request_info=Yes on re-eval when an
  // override (now resolved server-side) demands additional information.
  const requestInfoSet = criteria.some((c) => c.request_info === "Yes");

  const approvedIds: StepId[] = [];
  if (l1Approved) approvedIds.push("l1");
  if (l2Approved) approvedIds.push("l2");

  // Adapt Criterion[] → L3OverrideForm's lighter shape ({s_no:string, criterion:string}).
  const l3FormCriteria = useMemo(
    () =>
      criteria.map((c) => ({
        s_no: String(c.s_no),
        criterion: c.qualification || c.category || `Criterion ${c.s_no}`,
      })),
    [criteria],
  );

  async function postOverrideL1(o: L1Override) {
    const res = await postJson(`/api/usecases/cucp-reevals/run/${runId}/level/1/override`, { override: o });
    if (res) setStagedCounts((c) => ({ ...c, l1: c.l1 + 1 }));
  }

  async function postUndoL1() {
    const res = await postJson(`/api/usecases/cucp-reevals/run/${runId}/level/1/undo`);
    if (res) setStagedCounts((c) => ({ ...c, l1: Math.max(0, c.l1 - 1) }));
  }

  async function postClearL1() {
    const res = await postJson(`/api/usecases/cucp-reevals/run/${runId}/level/1/clear`);
    if (res) setStagedCounts((c) => ({ ...c, l1: 0 }));
  }

  async function postApproveL1() {
    const res = await postJson(`/api/usecases/cucp-reevals/run/${runId}/level/1/approve`);
    if (res) {
      setL1Approved(true);
      setStep("l2");
    }
  }

  async function postOverrideL2(p: L2OverridePayload) {
    const res = await postJson(
      `/api/usecases/cucp-reevals/run/${runId}/level/2/override`,
      { override: p },
    );
    if (res) setStagedCounts((c) => ({ ...c, l2: c.l2 + 1 }));
    // No-op locally — wait for SSE-driven re-render via prop changes.
  }

  async function postApproveL2() {
    const res = await postJson(`/api/usecases/cucp-reevals/run/${runId}/level/2/approve`);
    if (res) {
      setL2Approved(true);
      setStep("l3");
    }
  }

  async function postOverrideL3(p: L3OverridePayload) {
    const res = await postJson(
      `/api/usecases/cucp-reevals/run/${runId}/level/3/override`,
      { override: p },
    );
    if (res) setStagedCounts((c) => ({ ...c, l3: c.l3 + 1 }));
  }

  async function postFinalize() {
    const res = await postJson(`/api/usecases/cucp-reevals/run/${runId}/finalize`);
    if (res) {
      setStep("done");
      onComplete();
    }
  }

  return (
    <div className="space-y-4">
      {step === "l1" && (
        <div className="space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
          <h3 className="text-sm font-semibold text-foreground">Live preview — Facts (W5)</h3>
          <p className="text-xs text-muted-foreground">
            What the AI extracted from the narrative. Re-runs after each approved correction.
          </p>
          <L1FactsTable facts={facts} />
        </div>
      )}

      {step === "l2" && (
        <div className="space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
          <h3 className="text-sm font-semibold text-foreground">Live preview — Legal Categories</h3>
          <p className="text-xs text-muted-foreground">
            How the AI classified each fact under 49 CFR §26.67. Updates after each approved correction.
          </p>
          <L2ClassificationsTable rows={classifications} />
        </div>
      )}

      {step === "l3" && (
        <div className="space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
          <h3 className="text-sm font-semibold text-foreground">Live preview — Criteria (Pass / Fail)</h3>
          <p className="text-xs text-muted-foreground">
            The AI&rsquo;s evidentiary verdict on each criterion. Updates after each approved correction.
          </p>
          <L3CriteriaTable criteria={criteria} />
        </div>
      )}

      <StepBar
        steps={STEPS}
        currentId={step}
        approvedIds={approvedIds}
        onJump={(id) => setStep(id as StepId)}
      />

      {actionError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-muted/30 px-3 py-1">
          L1: {persistentCounts.l1} persistent + {stagedCounts.l1} staged
        </span>
        <span className="rounded-full border border-border bg-muted/30 px-3 py-1">
          L2: {persistentCounts.l2} persistent + {stagedCounts.l2} staged
        </span>
        <span className="rounded-full border border-border bg-muted/30 px-3 py-1">
          L3: {persistentCounts.l3} persistent + {stagedCounts.l3} staged
        </span>
      </div>

      {step === "l1" && (
        <div className="space-y-3">
          {isReRunning && runningLevel !== null && <ReEvaluatingBanner level={runningLevel} />}
          <L1OverrideForm
            facts={facts}
            onSubmitOverride={postOverrideL1}
            onUndo={postUndoL1}
            onClear={postClearL1}
            stagedCount={stagedCounts.l1}
            persistentCount={persistentCounts.l1}
            disabled={isReRunning}
          />
          <div className="flex justify-end">
            <button
              type="button"
              className={PRIMARY_BTN_CLASS}
              onClick={postApproveL1}
              disabled={isReRunning}
            >
              Approve & Continue →
            </button>
          </div>
        </div>
      )}

      {step === "l2" && (
        <div className="space-y-3">
          {isReRunning && runningLevel !== null && <ReEvaluatingBanner level={runningLevel} />}
          <L2OverrideForm
            rows={classifications}
            onSaveOverride={postOverrideL2}
            disabled={isReRunning}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className={SECONDARY_BTN_CLASS}
              onClick={() => setStep("l1")}
            >
              ← Back to Facts
            </button>
            <button
              type="button"
              className={PRIMARY_BTN_CLASS}
              onClick={postApproveL2}
              disabled={isReRunning}
            >
              Approve & Continue →
            </button>
          </div>
        </div>
      )}

      {step === "l3" && (
        <div className="space-y-3">
          {isReRunning && runningLevel !== null && <ReEvaluatingBanner level={runningLevel} />}
          <RequestInfoBanner show={requestInfoSet} />
          <L3OverrideForm
            criteria={l3FormCriteria}
            onSave={postOverrideL3}
            disabled={isReRunning}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              className={SECONDARY_BTN_CLASS}
              onClick={() => setStep("l2")}
            >
              ← Back to Categories
            </button>
            <button
              type="button"
              className={PRIMARY_BTN_CLASS}
              onClick={postFinalize}
              disabled={isReRunning}
            >
              Submit & Finalize
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-3">
          <RequestInfoBanner show={requestInfoSet} />
          <h3 className="text-sm font-semibold">L3 Criteria (final)</h3>
          <L3CriteriaTable criteria={criteria} />
        </div>
      )}
    </div>
  );
}
