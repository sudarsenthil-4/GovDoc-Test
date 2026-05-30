"use client";
import { useState } from "react";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import { defaultCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { CucpL2Category, CucpL3Criterion } from "@/lib/usecases/cucp-reevals/rubric";
import { RubricShell } from "./shared/rubric-shell";
import { RubricSection } from "./shared/rubric-section";
import { RubricEditorCard, type EditorField } from "./shared/rubric-editor-card";
import { ConfirmDialog, type ConfirmRequest } from "./shared/confirm-dialog";

type ComposeTarget =
  | { kind: "addL3" }
  | { kind: "editL3"; sNo: number };

export function CucpRubricEdit({ initial }: { initial: CucpRubricData }) {
  const [l2, setL2] = useState<CucpL2Category[]>(() => initial.l2.map((c) => ({ ...c })));
  const [l3, setL3] = useState<CucpL3Criterion[]>(() => initial.l3.map((c) => ({ ...c })));
  const [target, setTarget] = useState<ComposeTarget | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const mandatory = l3.filter((c) => c.s_no <= 3);
  const evaluation = l3.filter((c) => c.s_no >= 4);

  function applyEditor(values: Record<string, string>) {
    if (!target) return;
    if (target.kind === "addL3") {
      const name = (values.name ?? "").trim();
      if (!name) return;
      const nextNo = (l3.reduce((max, c) => Math.max(max, c.s_no), 0) || 0) + 1;
      setL3((prev) => [
        ...prev,
        {
          s_no: nextNo,
          name,
          title: values.title || undefined,
          rule: values.rule || undefined,
          pass: values.pass || undefined,
          fail: values.fail || undefined,
        },
      ]);
      setDirty(true);
      setTarget(null);
      return;
    }
    if (target.kind === "editL3") {
      setL3((prev) =>
        prev.map((c) =>
          c.s_no === target.sNo
            ? {
                ...c,
                name: values.name ?? c.name,
                title: values.title || undefined,
                rule: values.rule || undefined,
                pass: values.pass || undefined,
                fail: values.fail || undefined,
              }
            : c,
        ),
      );
      setDirty(true);
      setTarget(null);
    }
  }

  function deleteL3(sNo: number) {
    const c = l3.find((x) => x.s_no === sNo);
    const heading = c?.title ?? c?.name ?? `#${sNo}`;
    setConfirm({
      title: "Delete criterion",
      message: `Delete criterion "${heading}"? This cannot be undone.`,
      confirmLabel: "Delete criterion",
      danger: true,
      onConfirm: () => {
        setL3((prev) => prev.filter((c) => c.s_no !== sNo).map((c, i) => ({ ...c, s_no: i + 1 })));
        setDirty(true);
        if (target?.kind === "editL3" && target.sNo === sNo) setTarget(null);
        setConfirm(null);
      },
    });
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/usecases/cucp-reevals/rubric", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ l2, l3 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg("Saved. Preview rubrics will reflect this on next load.");
      setDirty(false);
    } catch (e) {
      setMsg(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setConfirm({
      title: "Reset rubric",
      message: "Reset Validate Narrative rubric to defaults? This deletes any saved edits.",
      confirmLabel: "Reset to defaults",
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        setSaving(true);
        setMsg(null);
        try {
          const res = await fetch("/api/usecases/cucp-reevals/rubric", { method: "DELETE" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const def = defaultCucpRubric();
          setL2(def.l2.map((c) => ({ ...c })));
          setL3(def.l3.map((c) => ({ ...c })));
          setMsg("Reset to defaults.");
          setDirty(false);
          setTarget(null);
        } catch (e) {
          setMsg(`Reset failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          setSaving(false);
        }
      },
    });
  }

  const compose = target ? buildCompose(target, l3) : null;

  return (
    <div className="space-y-6 pb-2">
      <RubricShell
        description="Validate Narrative — three Mandatory Eligibility Requirements followed by four Scored Evaluation Criteria. Each criterion is judged YES or NO."
      >
        {l3.length === 0 ? (
          <RubricSection
            title="SED Criteria"
            count={0}
            countLabel="criterion"
            defaultOpen
          >
            <p className="border border-dashed border-[var(--color-line)] bg-[var(--color-cream-soft)] px-4 py-6 text-center text-[12.5px] text-[var(--color-ink-mute)]">
              No criteria yet. Click “Create criterion” to add the first one.
            </p>
          </RubricSection>
        ) : (
          <>
            <RubricSection
              title="Mandatory Eligibility Requirements"
              count={mandatory.length}
              countLabel="criterion"
              defaultOpen
            >
              <ol className="flex list-none flex-col">
                {mandatory.map((c) => (
                  <CriterionItem
                    key={c.s_no}
                    criterion={c}
                    onEdit={() => setTarget({ kind: "editL3", sNo: c.s_no })}
                    onDelete={() => deleteL3(c.s_no)}
                  />
                ))}
              </ol>
            </RubricSection>

            <RubricSection
              title="Scored Evaluation Criteria"
              count={evaluation.length}
              countLabel="criterion"
            >
              <ol className="flex list-none flex-col">
                {evaluation.map((c, i) => (
                  <CriterionItem
                    key={c.s_no}
                    criterion={c}
                    displayNumber={i + 1}
                    onEdit={() => setTarget({ kind: "editL3", sNo: c.s_no })}
                    onDelete={() => deleteL3(c.s_no)}
                  />
                ))}
              </ol>
            </RubricSection>
          </>
        )}
      </RubricShell>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setTarget({ kind: "addL3" })}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)]"
        >
          Create criterion
        </button>
      </div>

      <SaveBar
        saving={saving}
        msg={msg}
        dirty={dirty}
        onSave={onSave}
        onReset={onReset}
        downloadHref="/api/usecases/cucp-reevals/rubric/download"
        downloadLabel="Download .xlsx"
      />

      {target && compose && (
        <RubricEditorCard
          mode={compose.mode}
          title={compose.title}
          fields={compose.fields}
          initialValues={compose.initial}
          saveLabel={compose.saveLabel}
          onSave={applyEditor}
          onCancel={() => setTarget(null)}
        />
      )}

      {confirm && <ConfirmDialog request={confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

function CriterionItem({
  criterion: c,
  displayNumber,
  onEdit,
  onDelete,
}: {
  criterion: CucpL3Criterion;
  displayNumber?: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const heading = c.title ?? c.name;
  const marker = displayNumber !== undefined ? `${displayNumber}.` : `${c.s_no}.`;
  return (
    <li className="border-b border-[var(--color-line-soft)] py-3 last:border-b-0">
      <div className="grid grid-cols-[28px_1fr_auto] items-baseline gap-3.5">
        <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
          {marker}
        </span>
        <span className="text-[13.5px] font-medium leading-[1.5] text-[var(--color-ink)]">
          {heading}
        </span>
        <span className="flex shrink-0 gap-1">
          <button
            type="button"
            aria-label={`Edit ${heading}`}
            onClick={onEdit}
            className={chip()}
          >
            Edit
          </button>
          <button
            type="button"
            aria-label={`Delete ${heading}`}
            onClick={onDelete}
            className={chipDanger()}
          >
            Delete
          </button>
        </span>
      </div>
      {c.rule && (
        <p className="mt-2 ml-[42px] text-[12px] italic leading-[1.5] text-[var(--color-ink-mute)]">
          <span className="font-semibold not-italic text-[var(--color-ink-soft)]">Rule:</span>{" "}
          {c.rule}
        </p>
      )}
      <dl className="mt-2.5 ml-[42px] flex flex-col gap-1.5">
        <YesNoRow label="YES" text={c.pass} />
        <YesNoRow label="NO" text={c.fail} />
      </dl>
    </li>
  );
}

function YesNoRow({ label, text }: { label: string; text: string | undefined }) {
  return (
    <div className="grid grid-cols-[32px_1fr] items-baseline gap-2.5">
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
        {label}
      </span>
      <dd className="break-words text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">
        {text ?? "—"}
      </dd>
    </div>
  );
}

function chip() {
  return "rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted";
}

function chipDanger() {
  return "rounded-md border border-destructive/30 px-2.5 py-1 text-[11px] font-medium text-destructive/80 transition hover:bg-destructive/5 hover:text-destructive";
}

function buildCompose(
  target: ComposeTarget,
  l3: CucpL3Criterion[],
): {
  mode: "create" | "edit";
  title: string;
  saveLabel: string;
  fields: EditorField[];
  initial: Record<string, string>;
} {
  if (target.kind === "addL3") {
    return {
      mode: "create",
      title: "Criterion",
      saveLabel: "Add criterion",
      fields: [
        { name: "name", label: "Criterion name", type: "text", required: true },
        { name: "title", label: "Display title (optional)", type: "text" },
        { name: "rule", label: "Rule (optional)", type: "textarea" },
        { name: "pass", label: "YES definition (optional)", type: "textarea" },
        { name: "fail", label: "NO definition (optional)", type: "textarea" },
      ],
      initial: { name: "", title: "", rule: "", pass: "", fail: "" },
    };
  }
  const c = l3.find((x) => x.s_no === target.sNo);
  return {
    mode: "edit",
    title: `Criterion #${target.sNo}`,
    saveLabel: "Save criterion",
    fields: [
      { name: "name", label: "Criterion name", type: "text", required: true },
      { name: "title", label: "Display title (optional)", type: "text" },
      { name: "rule", label: "Rule (optional)", type: "textarea" },
      { name: "pass", label: "YES definition (optional)", type: "textarea" },
      { name: "fail", label: "NO definition (optional)", type: "textarea" },
    ],
    initial: {
      name: c?.name ?? "",
      title: c?.title ?? "",
      rule: c?.rule ?? "",
      pass: c?.pass ?? "",
      fail: c?.fail ?? "",
    },
  };
}

function SaveBar({
  saving,
  msg,
  dirty,
  onSave,
  onReset,
  downloadHref,
  downloadLabel,
}: {
  saving: boolean;
  msg: string | null;
  dirty: boolean;
  onSave: () => void;
  onReset: () => void;
  downloadHref: string;
  downloadLabel: string;
}) {
  const status = msg ?? (dirty ? "You have unsaved changes." : "No unsaved changes.");
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <span
        className={`text-xs ${dirty && !msg ? "font-medium text-foreground" : "text-muted-foreground"}`}
      >
        {status}
      </span>
      <div className="flex gap-2">
        <a
          href={downloadHref}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          {downloadLabel}
        </a>
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)] disabled:opacity-50"
        >
          {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
      </div>
    </div>
  );
}
