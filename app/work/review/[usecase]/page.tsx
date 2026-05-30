"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Download,
  HardHat,
  Loader2,
  MapPin,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { usePipelineStore } from "@/store/use-pipeline";
import { getUseCaseMetadata } from "@/lib/usecases/metadata";
import {
  WorkBreadcrumbs,
  WorkCard,
  WorkPageHeader,
} from "@/components/work/page-shell";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/work/form-fields";
import { InputsForm as CmgcInputsForm } from "@/components/work/cmgc/inputs-form";
import { ScoreTable } from "@/components/work/cmgc/score-table";
import { CmgcRubricView } from "@/components/work/rubric/cmgc-rubric-view";
import { RubricPreviewSlideDown } from "@/components/work/rubric/rubric-preview-slide-down";
import { RubricSelectorInline, type RubricSelection } from "@/components/work/rubric/rubric-selector-card";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { UseCaseId } from "@/lib/usecases/types";
import { RecommendationCard } from "@/components/work/cmgc/recommendation-card";
import { MethodRanking } from "@/components/work/cmgc/method-ranking";
import { HiflWizard, type HiflOverrideEntry } from "@/components/work/cmgc/hifl-wizard";
import type { OverrideCardQuestion } from "@/components/work/cmgc/override-card";
import { RUBRIC_QUESTIONS } from "@/lib/usecases/cmgc-pde/rubric";
import { useOverridesStore } from "@/store/use-overrides";
import { InputsForm as CucpInputsForm } from "@/components/work/cucp/inputs-form";
import { CucpStepper } from "@/components/work/cucp/cucp-stepper";
import { ReportView } from "@/components/work/cucp/report-view";
import type { L2Row } from "@/components/work/cucp/l2-classifications-table";
import { InputsForm as RowInputsForm } from "@/components/work/row/inputs-form";
import { RowResultTabs } from "@/components/work/row/result-tabs";
import { composeCmgcResult } from "@/lib/usecases/cmgc-pde/compose-result";
import { composeCmgcReport } from "@/lib/usecases/cmgc-pde/compose-report";
import type { Level1Data, Level2Data, Level3Data } from "@/lib/usecases/cucp-reevals/types";
import type { RowRunResult } from "@/lib/usecases/row-appraisal/types";

type RouteParams = { usecase: string };

const USECASE_ICON: Record<string, LucideIcon> = {
  "cmgc-pde": HardHat,
  "cucp-reevals": BadgeCheck,
  "row-appraisal": MapPin,
};

const USECASE_EYEBROW: Record<string, string> = {
  "cmgc-pde": "Procurement & Contract",
  "cucp-reevals": "Certification & Eligibility",
  "row-appraisal": "Real Property & Appraisal",
};

const HOW_IT_WORKS: Record<string, string[]> = {
  "cmgc-pde": [
    "Upload one or more nomination fact sheets (DOCX/PDF).",
    "GovDoc rates the project across the 25-category delivery rubric and scores delivery method fit.",
    "You review the recommendation, validate it, and export DOCX or XLSX.",
  ],
  "cucp-reevals": [
    "Upload the firm's Personal Narrative Statement (and revenues if available).",
    "Three-pass review runs: facts extracted, §26.67 criteria evaluated, classifications surfaced.",
    "You confirm or override criteria. GovDoc generates the final eligibility report.",
  ],
  "row-appraisal": [
    "Upload the appraisal PDF (one of the four bundled samples is recommended for Phase 1).",
    "GovDoc scores the report against the 34-category rubric using the chosen LLM provider.",
    "You review category-level scores and export to Excel or DOCX.",
  ],
};

export default function UseCasePage({ params }: { params: Promise<RouteParams> }) {
  const { usecase } = use(params);
  const router = useRouter();
  const current = usePipelineStore((s) => s.current);
  const reset = usePipelineStore((s) => s.reset);

  // Discard the in-flight / done pipeline run and any HIFL overrides when
  // the user leaves this page or navigates to a different use-case. Without
  // this, zustand keeps `current` and `overrides.history` alive across
  // route changes, so a re-visit shows the previous run's "done" view
  // instead of a fresh upload form.
  useEffect(() => {
    return () => {
      reset();
      useOverridesStore.getState().clear();
    };
  }, [usecase, reset]);

  const uc = getUseCaseMetadata(usecase);
  if (!uc) {
    return (
      <div className="space-y-4">
        <WorkBreadcrumbs
          crumbs={[
            { label: "Workspace", href: "/workspace" },
            { label: "Validate Documents", href: "/work/review" },
            { label: "Unknown" },
          ]}
        />
        <div className="border border-[var(--color-line)] bg-[var(--color-paper)] p-8 text-center">
          <p className="text-[13px] text-[var(--color-ink-mute)]">Unknown use case.</p>
          <button
            type="button"
            onClick={() => router.push("/work/review")}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to picker
          </button>
        </div>
      </div>
    );
  }

  const Icon = USECASE_ICON[usecase] ?? CheckCircle2;
  const eyebrow = USECASE_EYEBROW[usecase];
  const steps = HOW_IT_WORKS[usecase] ?? [];

  const headerBlock = (
    <>
      <WorkBreadcrumbs
        crumbs={[
          { label: "Workspace", href: "/workspace" },
          { label: "Validate Documents", href: "/work/review" },
          { label: uc.label },
        ]}
      />
      <WorkPageHeader
        icon={Icon}
        eyebrow={eyebrow}
        title={uc.label}
        blurb={uc.blurb}
      />
    </>
  );

  if (usecase === "cmgc-pde") {
    return (
      <div className="space-y-6">
        {headerBlock}
        <CmgcView ucLabel={uc.label} steps={steps} exporters={uc.exporters} current={current} reset={reset} />
      </div>
    );
  }
  if (usecase === "cucp-reevals") {
    return (
      <div className="space-y-6">
        {headerBlock}
        <CucpView ucLabel={uc.label} steps={steps} exporters={uc.exporters} current={current} reset={reset} />
      </div>
    );
  }
  if (usecase === "row-appraisal") {
    return (
      <div className="space-y-6">
        {headerBlock}
        <RowView ucLabel={uc.label} steps={steps} exporters={uc.exporters} current={current} reset={reset} />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {headerBlock}
      <div className="border border-[var(--color-line)] bg-[var(--color-paper)] p-8 text-[13px] text-[var(--color-ink-mute)]">
        Use case <code className="bg-[var(--color-cream-soft)] px-1 py-0.5 font-mono text-[12px]">{usecase}</code> not yet implemented.
      </div>
    </div>
  );
}

type ViewProps = {
  ucLabel: string;
  steps: string[];
  exporters: { id: string; label: string }[];
  current: ReturnType<typeof usePipelineStore.getState>["current"];
  reset: () => void;
};

function HowItWorks({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <WorkCard title="How it works">
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {i + 1}
            </span>
            <span className="text-foreground/85 leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </WorkCard>
  );
}

function IdleLayout({
  usecaseId,
  steps,
  renderInputs,
}: {
  usecaseId: UseCaseId;
  steps: string[];
  renderInputs: (sel: RubricSelection | null) => React.ReactNode;
}) {
  const [selection, setSelection] = useState<RubricSelection | null>(null);
  const handleChange = useCallback((sel: RubricSelection) => setSelection(sel), []);
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <WorkCard
        title="Inputs"
        description="Provide the documents to evaluate."
        headerRight={<RubricSelectorInline usecaseId={usecaseId} onChange={handleChange} />}
      >
        <div className="space-y-4">
          <RubricPreviewSlideDown usecaseId={usecaseId} />
          {renderInputs(selection)}
        </div>
      </WorkCard>
      <HowItWorks steps={steps} />
    </div>
  );
}

const RUBRIC_BY_ID = new Map(RUBRIC_QUESTIONS.map((q) => [q.id, q]));

function toOverrideCardQuestion(r: { question_id: string; question_text: string; selected_rating: string; confidence: number; source_reasoning: string }): OverrideCardQuestion {
  const rubric = RUBRIC_BY_ID.get(r.question_id);
  return {
    question_id: r.question_id,
    question_text: r.question_text || rubric?.question || "",
    ai_rating: (r.selected_rating as "A" | "B" | "C") ?? "A",
    confidence: r.confidence ?? null,
    source_reasoning: r.source_reasoning ?? "",
    options: {
      A: rubric?.option_a ?? "",
      B: rubric?.option_b ?? "",
      C: rubric?.option_c ?? "",
    },
  };
}

function CmgcView({ ucLabel, steps, exporters, current, reset }: ViewProps) {
  const overrideHistory = useOverridesStore((s) => s.history);
  const pushOverride = useOverridesStore((s) => s.push);

  if (!current || (current.status === "idle" && Object.keys(current.stages).length === 0)) {
    return (
      <IdleLayout
        usecaseId="cmgc-pde"
        steps={steps}
        renderInputs={(sel) => (
          <CmgcInputsForm
            rubricId={sel?.rubricId}
            rubricVersionId={sel?.versionId ?? undefined}
          />
        )}
      />
    );
  }
  if (current.status === "running" || current.status === "needs-input") {
    return <RunningPanel current={current} reset={reset} />;
  }
  if (current.status === "error") {
    return <ErrorPanel current={current} reset={reset} />;
  }
  if (current.status === "done" && current.result) {
    const out = composeCmgcResult(current.result);
    if (out.kind === "debug") {
      return <DebugRawResult raw={out.raw} reset={reset} expected={[]} error={out.error} />;
    }
    const result = out.value;

    const overrideMap = new Map<string, HiflOverrideEntry>();
    for (const e of overrideHistory) {
      overrideMap.set(e.category, {
        question_id: e.category,
        oldValue: e.oldValue as "A" | "B" | "C",
        newValue: e.newValue as "A" | "B" | "C",
        reason: e.reason,
      });
    }
    const wizardOverrides = Array.from(overrideMap.values());

    const recommendationLabel = result.recommendation.recommended_method ?? "—";
    const role = current.role ?? "district";

    return (
      <div className="space-y-6">
        <DoneSummaryBar ucLabel={ucLabel} reset={reset} />
        <RecommendationCard recommendation={result.recommendation} />
        <MethodRanking multiMethod={result.multi_method} />
        {role === "district" ? (
          <>
            <div className="space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
              <h3 className="text-sm font-semibold text-foreground">Project rubric scores</h3>
              <ScoreTable ratings={result.evaluation.ratings} />
            </div>
            <DownloadFooterBar useCaseId="cmgc-pde" exporters={exporters} result={result} />
          </>
        ) : (
          <CmgcHiflSection
            exporters={exporters}
            result={result}
            recommendationLabel={recommendationLabel}
            wizardOverrides={wizardOverrides}
            overrideHistory={overrideHistory}
            pushOverride={pushOverride}
          />
        )}
      </div>
    );
  }
  return null;
}

function CmgcHiflSection({
  exporters,
  result,
  recommendationLabel,
  wizardOverrides,
  overrideHistory,
  pushOverride,
}: {
  exporters: { id: string; label: string }[];
  result: unknown;
  recommendationLabel: string;
  wizardOverrides: HiflOverrideEntry[];
  overrideHistory: ReturnType<typeof useOverridesStore.getState>["history"];
  pushOverride: ReturnType<typeof useOverridesStore.getState>["push"];
}) {
  const [approved, setApproved] = useState(false);
  const [rubric, setRubric] = useState<CmgcRubricData | null>(null);
  const r = result as NonNullable<Extract<ReturnType<typeof composeCmgcResult>, { kind: "ok" }>["value"]>;

  useEffect(() => {
    let alive = true;
    fetch("/api/usecases/cmgc-pde/rubric")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CmgcRubricData | null) => {
        if (alive && data) setRubric(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <HiflWizard
        questions={r.evaluation.ratings.map(toOverrideCardQuestion)}
        recommendationLabel={recommendationLabel}
        overrides={wizardOverrides}
        markdownReport={composeCmgcReport(
          r,
          wizardOverrides.map((o) => ({
            question_id: o.question_id,
            oldValue: o.oldValue,
            newValue: o.newValue,
            reason: o.reason,
          })),
        )}
        previewTable={<ScoreTable ratings={r.evaluation.ratings} />}
        rubricPreview={rubric ? <CmgcRubricView data={rubric} compact /> : null}
        onApprove={() => setApproved(true)}
        onSaveOverride={(entry) =>
          pushOverride({
            category: entry.question_id,
            oldValue: entry.oldValue,
            newValue: entry.newValue,
            reason: entry.reason,
          })
        }
        onRemoveOverride={(qid) => {
          const remaining = overrideHistory.filter((e) => e.category !== qid);
          useOverridesStore.getState().clear();
          for (const e of remaining) {
            pushOverride({
              category: e.category,
              oldValue: e.oldValue,
              newValue: e.newValue,
              reason: e.reason,
            });
          }
        }}
      />
      {approved && (
        <DownloadFooterBar useCaseId="cmgc-pde" exporters={exporters} result={r} />
      )}
    </>
  );
}

function CucpView({ ucLabel, steps, exporters, current, reset }: ViewProps) {
  const [overridesSubmitted, setOverridesSubmitted] = useState(false);

  if (!current || (current.status === "idle" && Object.keys(current.stages).length === 0)) {
    return (
      <IdleLayout
        usecaseId="cucp-reevals"
        steps={steps}
        renderInputs={(sel) => (
          <CucpInputsForm
            rubricId={sel?.rubricId}
            rubricVersionId={sel?.versionId ?? undefined}
          />
        )}
      />
    );
  }

  if (current.status === "needs-input" && !overridesSubmitted) {
    const level1 = (current.stages.level1?.data ?? {}) as Level1Data;
    const level2 = (current.stages.level2?.data ?? {}) as Level2Data;
    const level3 = (current.stages.level3?.data ?? { criteria: [] }) as Level3Data;

    const facts = level1.extracted_facts ?? [];
    const classifications: L2Row[] = (level2.classifications ?? []).map((c) => ({
      fact_id: c.fact_id,
      category: c.classification,
      summary: c.summary,
      ai_reasoning: c.reasoning,
    }));
    const criteria = level3.criteria ?? [];

    // Re-running = a level stage is currently being re-evaluated after an override.
    // Scope to the three level stages only — the route emits a `progress init` event
    // at run start with no matching `stage-done`, so a generic
    // `some(s.status === "running")` check would stay true forever and permanently
    // disable Approve & Continue.
    const runningStage = (["level1", "level2", "level3"] as const).find(
      (id) => current.stages[id]?.status === "running",
    );
    const isReRunning = runningStage !== undefined;
    const runningLevel: 1 | 2 | 3 | null = runningStage
      ? (Number(runningStage.slice("level".length)) as 1 | 2 | 3)
      : null;

    return (
      <div className="space-y-6">
        <RubricPreviewSlideDown usecaseId="cucp-reevals" />
        <WorkCard
          title="Reviewer override"
          description="GovDoc has completed the three review passes. Walk through Facts → Legal Categories → Criteria and apply any corrections before generating the final report."
        >
          <CucpStepper
            runId={current.runId}
            projectId={current.projectId}
            facts={facts}
            classifications={classifications}
            criteria={criteria}
            isReRunning={isReRunning}
            runningLevel={runningLevel}
            onComplete={() => setOverridesSubmitted(true)}
          />
        </WorkCard>
        <div className="flex justify-end">
          <SecondaryButton onClick={reset}>Cancel</SecondaryButton>
        </div>
      </div>
    );
  }

  if (current.status === "running" || current.status === "needs-input") {
    return <RunningPanel current={current} reset={reset} />;
  }
  if (current.status === "error") {
    return <ErrorPanel current={current} reset={reset} />;
  }
  if (current.status === "done" && current.result) {
    const result = current.result as Record<string, unknown>;
    const report = result.report as { markdown_report?: string } | undefined;
    return (
      <div className="space-y-6">
        <DoneSummaryBar ucLabel={ucLabel} reset={reset} />
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-5">
          <ReportView markdown={report?.markdown_report ?? "_No report generated._"} />
        </div>
        <DownloadFooterBar useCaseId="cucp-reevals" exporters={exporters} result={result} />
      </div>
    );
  }
  return null;
}

function RowView({ ucLabel, steps, exporters, current, reset }: ViewProps) {
  if (!current || (current.status === "idle" && Object.keys(current.stages).length === 0)) {
    return (
      <IdleLayout
        usecaseId="row-appraisal"
        steps={steps}
        renderInputs={(sel) => (
          <RowInputsForm
            rubricId={sel?.rubricId}
            rubricVersionId={sel?.versionId ?? undefined}
          />
        )}
      />
    );
  }
  if (current.status === "running" || current.status === "needs-input") {
    return <RunningPanel current={current} reset={reset} />;
  }
  if (current.status === "error") {
    return <ErrorPanel current={current} reset={reset} />;
  }
  if (current.status === "done" && current.result) {
    const prior = current.result as Record<string, unknown>;
    const rowResult = prior.consolidate as RowRunResult;
    if (!rowResult?.evaluation_results)
      return <DebugRawResult raw={current.result} reset={reset} expected={["consolidate.evaluation_results"]} />;
    return (
      <div className="space-y-6">
        <DoneSummaryBar ucLabel={ucLabel} reset={reset} />
        <RowResultTabs results={rowResult.evaluation_results} />
        <DownloadFooterBar useCaseId="row-appraisal" exporters={exporters} result={rowResult} />
      </div>
    );
  }
  return null;
}

function RunningPanel({
  current,
  reset,
}: {
  current: NonNullable<ViewProps["current"]>;
  reset: () => void;
}) {
  return (
    <WorkCard
      title="Running pipeline"
      description="GovDoc is processing your inputs. This may take a few minutes."
    >
      <ul className="space-y-2">
        {Object.values(current.stages).map((stage) => {
          const done = stage.status === "done";
          const error = stage.status === "error";
          return (
            <li
              key={stage.id}
              className={`flex items-center justify-between border px-3 py-2.5 text-sm ${
                error
                  ? "border-destructive/30 bg-destructive/5"
                  : done
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[var(--color-line)] bg-[var(--color-cream-soft)]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {done ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : error ? (
                  <AlertTriangle className="size-4 text-destructive" />
                ) : (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                <span className="font-medium text-foreground">
                  {stage.label || stage.id}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {stage.status}
                {stage.pct > 0 && ` · ${stage.pct}%`}
                {stage.message && ` · ${stage.message}`}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex justify-end">
        <SecondaryButton onClick={reset}>Cancel</SecondaryButton>
      </div>
    </WorkCard>
  );
}

function ErrorPanel({
  current,
  reset,
}: {
  current: NonNullable<ViewProps["current"]>;
  reset: () => void;
}) {
  const errMsg =
    Object.values(current.stages).find((s) => s.status === "error")?.error ??
    "Unknown error";
  return (
    <WorkCard>
      <div className="flex items-start gap-3 border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="size-5 shrink-0 text-destructive" />
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-semibold text-destructive">
            Pipeline failed
          </h3>
          <p className="text-sm text-foreground/85">{errMsg}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <SecondaryButton onClick={reset}>
          <RotateCcw className="size-4" /> Start over
        </SecondaryButton>
      </div>
    </WorkCard>
  );
}

function DoneSummaryBar({
  ucLabel,
  reset,
}: {
  ucLabel: string;
  reset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <CheckCircle2 className="size-5 text-[var(--color-govdoc-primary)]" />
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-foreground">
            {ucLabel} complete
          </div>
          <div className="text-xs text-muted-foreground">
            Review the results below. Download options appear at the bottom once you finish reviewing.
          </div>
        </div>
      </div>
      <PrimaryButton type="button" onClick={reset}>
        <RotateCcw className="size-4" /> Run again
      </PrimaryButton>
    </div>
  );
}

function DownloadFooterBar({
  useCaseId,
  exporters,
  result,
}: {
  useCaseId: string;
  exporters: { id: string; label: string }[];
  result: unknown;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
      <span className="mr-auto text-xs text-muted-foreground">
        Download the finalized evaluation:
      </span>
      {exporters.map((e) => (
        <SecondaryButton
          key={e.id}
          onClick={() => downloadExport(useCaseId, e.id, e.label, result)}
        >
          <Download className="size-4" /> {e.label}
        </SecondaryButton>
      ))}
    </div>
  );
}

function DebugRawResult({
  raw,
  reset,
  expected,
  error,
}: {
  raw: unknown;
  reset: () => void;
  expected: string[];
  error?: string;
}) {
  const json = JSON.stringify(raw, null, 2);
  const truncated = json.length > 8000 ? json.slice(0, 8000) + "\n…(truncated)" : json;
  const topLevelKeys =
    raw && typeof raw === "object" ? Object.keys(raw as Record<string, unknown>).join(", ") : "(non-object)";
  return (
    <WorkCard title="Pipeline returned an unexpected shape">
      <div className="space-y-3">
        {error ? (
          <p className="text-sm text-muted-foreground">
            The pipeline finished but the result has an unexpected shape:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{error}</code>.
            Got top-level keys:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{topLevelKeys}</code>.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            The pipeline finished but the result is missing expected fields. Expected:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{expected.join(", ")}</code>.
            Got top-level keys:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{topLevelKeys}</code>.
          </p>
        )}
        <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-3 text-[11px] leading-snug">
{truncated}
        </pre>
        <div className="flex justify-end">
          <SecondaryButton onClick={reset}>
            <RotateCcw className="size-4" /> Start over
          </SecondaryButton>
        </div>
      </div>
    </WorkCard>
  );
}


async function downloadExport(useCaseId: string, exporterId: string, label: string, result: unknown) {
  const res = await fetch(`/api/usecases/${useCaseId}/export/${exporterId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  if (!res.ok) {
    alert(`${label} failed (${res.status})`);
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ext = exporterId === "docx" ? "docx" : exporterId === "json" ? "json" : "xlsx";
  a.download = `${useCaseId}-${exporterId}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
