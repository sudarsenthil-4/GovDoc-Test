"use client";
import { useState } from "react";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import { defaultCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { RubricQuestion } from "@/lib/usecases/cmgc-pde/rubric";
import { RubricShell } from "./shared/rubric-shell";
import { RubricSection } from "./shared/rubric-section";
import {
  RubricEditorCard,
  type EditorField,
  type EditorSelect,
} from "./shared/rubric-editor-card";
import { ConfirmDialog, type ConfirmRequest } from "./shared/confirm-dialog";
import { CreateNewMenu } from "./shared/create-new-menu";

type SectionWeightKey = keyof CmgcRubricData["weights"];

type ComposeTarget =
  | { kind: "addSection" }
  | { kind: "editSection"; sectionKey: SectionWeightKey }
  | { kind: "addQuestion"; sectionKey: SectionWeightKey; sectionLabel: string }
  | { kind: "editQuestion"; questionId: string };

function nextSectionKey(existing: SectionWeightKey[]): SectionWeightKey | null {
  const all = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
  for (const k of all) {
    if (!existing.includes(k as SectionWeightKey)) return k as SectionWeightKey;
  }
  return null;
}

function sectionLabel(key: string, name: string) {
  return `${key}: ${name}`;
}

export function CmgcRubricEdit({ initial }: { initial: CmgcRubricData }) {
  const [questions, setQuestions] = useState<RubricQuestion[]>(() =>
    initial.questions.map((q) => ({ ...q })),
  );
  const [weights, setWeights] = useState<CmgcRubricData["weights"]>(() => ({
    ...initial.weights,
  }));
  const [sectionNames, setSectionNames] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const q of initial.questions) {
      const m = q.section.match(/^([A-Z]):\s*(.+)$/);
      if (m && m[1] && m[2]) out[m[1]] = m[2];
    }
    return out;
  });
  const [target, setTarget] = useState<ComposeTarget | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sectionKeys = (Object.keys(weights) as SectionWeightKey[]).sort();
  const sectionsMap = new Map<
    string,
    { key: SectionWeightKey; name: string; qs: RubricQuestion[] }
  >();
  for (const k of sectionKeys) {
    sectionsMap.set(k, { key: k, name: sectionNames[k] ?? k, qs: [] });
  }
  for (const q of questions) {
    const m = q.section.match(/^([A-Z]):\s*(.+)$/);
    const key = (m?.[1] ?? "Z") as SectionWeightKey;
    const name = m?.[2] ?? q.section;
    const cur = sectionsMap.get(key) ?? { key, name, qs: [] };
    if (name) cur.name = name;
    cur.qs.push(q);
    sectionsMap.set(key, cur);
  }
  const sections = Array.from(sectionsMap.values());

  function openCreate(kind: "section" | "question") {
    if (kind === "section") {
      setTarget({ kind: "addSection" });
    } else {
      const first = sections[0];
      if (!first) return;
      setTarget({
        kind: "addQuestion",
        sectionKey: first.key,
        sectionLabel: sectionLabel(first.key, first.name),
      });
    }
  }

  function applyEditor(values: Record<string, string>) {
    if (!target) return;
    if (target.kind === "addSection") {
      const newKey = nextSectionKey(sectionKeys);
      if (!newKey) return;
      const name = (values.name ?? "").trim();
      const weight = Number(values.weight ?? "0");
      if (!name || Number.isNaN(weight)) return;
      setWeights((prev) => ({ ...prev, [newKey]: weight }));
      setSectionNames((prev) => ({ ...prev, [newKey]: name }));
      setDirty(true);
      setTarget(null);
      return;
    }
    if (target.kind === "editSection") {
      const { sectionKey } = target;
      const newName = (values.name ?? "").trim();
      const newWeight = Number(values.weight ?? "0");
      const oldName = sectionsMap.get(sectionKey)?.name ?? sectionKey;
      const oldLabel = sectionLabel(sectionKey, oldName);
      const newLabel = sectionLabel(sectionKey, newName);
      setQuestions((prev) =>
        prev.map((q) => (q.section === oldLabel ? { ...q, section: newLabel } : q)),
      );
      if (!Number.isNaN(newWeight)) {
        setWeights((prev) => ({ ...prev, [sectionKey]: newWeight }));
      }
      setSectionNames((prev) => ({ ...prev, [sectionKey]: newName }));
      setDirty(true);
      setTarget(null);
      return;
    }
    if (target.kind === "addQuestion") {
      setQuestions((prev) => [
        ...prev,
        {
          id: `Q${Date.now()}`,
          section: target.sectionLabel,
          question: values.question ?? "",
          option_a: values.option_a ?? "",
          option_b: values.option_b ?? "",
          option_c: values.option_c ?? "",
        },
      ]);
      setDirty(true);
      setTarget(null);
      return;
    }
    if (target.kind === "editQuestion") {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === target.questionId
            ? {
                ...q,
                question: values.question ?? q.question,
                option_a: values.option_a ?? q.option_a,
                option_b: values.option_b ?? q.option_b,
                option_c: values.option_c ?? q.option_c,
              }
            : q,
        ),
      );
      setDirty(true);
      setTarget(null);
    }
  }

  function deleteSection(key: SectionWeightKey) {
    const name = sectionsMap.get(key)?.name ?? key;
    setConfirm({
      title: "Delete section",
      message: `Delete section ${key} (${name}) and all its questions? This cannot be undone.`,
      confirmLabel: "Delete section",
      danger: true,
      onConfirm: () => {
        setQuestions((prev) => prev.filter((q) => !q.section.startsWith(`${key}:`)));
        setWeights((prev) => {
          const next = { ...prev };
          delete (next as Record<string, number>)[key];
          return next;
        });
        setSectionNames((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setDirty(true);
        if (target?.kind === "editSection" && target.sectionKey === key) setTarget(null);
        setConfirm(null);
      },
    });
  }

  function deleteQuestion(id: string) {
    setConfirm({
      title: "Delete question",
      message: `Delete question ${id}? This cannot be undone.`,
      confirmLabel: "Delete question",
      danger: true,
      onConfirm: () => {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setDirty(true);
        if (target?.kind === "editQuestion" && target.questionId === id) setTarget(null);
        setConfirm(null);
      },
    });
  }

  async function onSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/usecases/cmgc-pde/rubric", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questions, weights }),
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
      message: "Reset Validate Project rubric to defaults? This deletes any saved edits.",
      confirmLabel: "Reset to defaults",
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        setSaving(true);
        setMsg(null);
        try {
          const res = await fetch("/api/usecases/cmgc-pde/rubric", { method: "DELETE" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const def = defaultCmgcRubric();
          setQuestions(def.questions.map((q) => ({ ...q })));
          setWeights({ ...def.weights });
          const names: Record<string, string> = {};
          for (const q of def.questions) {
            const m = q.section.match(/^([A-Z]):\s*(.+)$/);
            if (m && m[1] && m[2]) names[m[1]] = m[2];
          }
          setSectionNames(names);
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

  function onSelectChange(name: string, value: string) {
    if (name === "section" && target?.kind === "addQuestion") {
      const sec = sectionsMap.get(value);
      if (sec) {
        setTarget({
          kind: "addQuestion",
          sectionKey: sec.key,
          sectionLabel: sectionLabel(sec.key, sec.name),
        });
      }
    }
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const weightOk = Math.abs(totalWeight - 1) < 0.005;

  const compose = target ? buildCompose(target, sectionsMap, weights, questions) : null;
  const selects = target ? buildSelects(target, sections) : undefined;

  // Per-section weights now surface as a subtle chip in the section header
  // (RubricSection's `weight` prop). The Σ validity check is the only thing
  // worth keeping at the page level — and only when it actually fails, so
  // the editor stays uncluttered in the common case. Editing a single
  // section's weight is still done through the existing "Edit section" form.
  const weightWarning = !weightOk && sections.length > 0 ? (
    <div
      role="alert"
      className="rounded-md border border-l-4 border-destructive/30 border-l-destructive bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
    >
      Section weights total {totalWeight.toFixed(2)} — must equal 1.00 before saving.
    </div>
  ) : null;

  return (
    <div className="space-y-6 pb-2">
      <RubricShell
        description="Validate Project rubric — six sections, each scored on a 3-tier A/B/C scale. Section weights combine into a weighted composite recommendation across eight delivery methods."
        intro={weightWarning}
      >
        {sections.length === 0 ? (
          <div className="border border-dashed border-[var(--color-line)] bg-[var(--color-cream-soft)] px-6 py-12 text-center">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              Empty rubric
            </p>
            <p className="mt-2 text-[13px] text-[var(--color-ink-mute)]">
              No sections yet. Use “Create new ▾ → Section” to add the first one.
            </p>
          </div>
        ) : (
          sections.map((s, i) => (
            <RubricSection
              key={s.key}
              title={s.name}
              count={s.qs.length}
              countLabel="question"
              weight={weights[s.key]}
              defaultOpen={i === 0}
            >
              <div className="mb-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTarget({ kind: "editSection", sectionKey: s.key })}
                  className={chip()}
                >
                  Edit section
                </button>
                <button
                  type="button"
                  onClick={() => deleteSection(s.key)}
                  className={chipDanger()}
                >
                  Delete section
                </button>
              </div>
              {s.qs.length === 0 ? (
                <p className="border border-dashed border-[var(--color-line)] bg-[var(--color-cream-soft)] px-4 py-6 text-center text-[12.5px] text-[var(--color-ink-mute)]">
                  No questions yet. Use “Create new ▾ → Question” and pick this section.
                </p>
              ) : (
                <ol className="flex list-none flex-col gap-4">
                  {s.qs.map((q, qi) => (
                    <li
                      key={q.id}
                      className="border-b border-[var(--color-line-soft)] py-3 last:border-b-0"
                    >
                      <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3.5 text-[13.5px] leading-[1.5] text-[var(--color-ink-soft)]">
                        <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
                          {qi + 1}.
                        </span>
                        <span className="font-medium">{q.question}</span>
                        <span className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${q.id}`}
                            onClick={() => setTarget({ kind: "editQuestion", questionId: q.id })}
                            className={chip()}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${q.id}`}
                            onClick={() => deleteQuestion(q.id)}
                            className={chipDanger()}
                          >
                            Delete
                          </button>
                        </span>
                      </div>
                      <dl className="mt-2.5 ml-[42px] flex flex-col gap-1.5">
                        <RatingRow letter="A" text={q.option_a} />
                        <RatingRow letter="B" text={q.option_b} />
                        <RatingRow letter="C" text={q.option_c} />
                      </dl>
                    </li>
                  ))}
                </ol>
              )}
            </RubricSection>
          ))
        )}
      </RubricShell>

      <div className="flex items-center justify-end">
        <CreateNewMenu
          options={[
            { value: "section", label: "Section" },
            { value: "question", label: "Question", disabled: sections.length === 0 },
          ]}
          onPick={(v) => openCreate(v as "section" | "question")}
        />
      </div>

      <SaveBar
        saving={saving}
        msg={msg}
        dirty={dirty}
        onSave={onSave}
        onReset={onReset}
        downloadHref="/api/usecases/cmgc-pde/rubric/download"
        downloadLabel="Download .xlsx"
      />

      {target && compose && (
        <RubricEditorCard
          mode={compose.mode}
          title={compose.title}
          selects={selects}
          onSelectChange={onSelectChange}
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

function RatingRow({ letter, text }: { letter: "A" | "B" | "C"; text: string }) {
  return (
    <div className="grid grid-cols-[24px_1fr] items-baseline gap-2.5">
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
        {letter}.
      </span>
      <span className="text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">{text || "—"}</span>
    </div>
  );
}

function chip() {
  return "rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted";
}

function chipDanger() {
  return "rounded-md border border-destructive/30 px-2.5 py-1 text-[11px] font-medium text-destructive/80 transition hover:bg-destructive/5 hover:text-destructive";
}

function buildSelects(
  target: ComposeTarget,
  sections: { key: string; name: string; qs: RubricQuestion[] }[],
): EditorSelect[] | undefined {
  if (target.kind === "addQuestion") {
    return [
      {
        name: "section",
        label: "Section",
        value: target.sectionKey,
        options: sections.map((s) => ({ value: s.key, label: s.name })),
      },
    ];
  }
  return undefined;
}

function buildCompose(
  target: ComposeTarget,
  sectionsMap: Map<string, { key: string; name: string; qs: RubricQuestion[] }>,
  weights: CmgcRubricData["weights"],
  questions: RubricQuestion[],
): {
  mode: "create" | "edit";
  title: string;
  saveLabel: string;
  fields: EditorField[];
  initial: Record<string, string>;
} {
  if (target.kind === "addSection") {
    return {
      mode: "create",
      title: "Section",
      saveLabel: "Add section",
      fields: [
        { name: "name", label: "Section name", type: "text", required: true },
        { name: "weight", label: "Weight (0–1)", type: "text", required: true },
      ],
      initial: { name: "", weight: "" },
    };
  }
  if (target.kind === "editSection") {
    const sec = sectionsMap.get(target.sectionKey);
    return {
      mode: "edit",
      title: `Section ${target.sectionKey}: ${sec?.name ?? ""}`,
      saveLabel: "Save section",
      fields: [
        { name: "name", label: "Section name", type: "text", required: true },
        { name: "weight", label: "Weight (0–1)", type: "text", required: true },
      ],
      initial: {
        name: sec?.name ?? "",
        weight: String((weights as Record<string, number>)[target.sectionKey] ?? 0),
      },
    };
  }
  if (target.kind === "addQuestion") {
    return {
      mode: "create",
      title: "Question",
      saveLabel: "Add question",
      fields: [
        { name: "question", label: "Question", type: "textarea", required: true },
        { name: "option_a", label: "Option A (best rating)", type: "textarea", required: true },
        { name: "option_b", label: "Option B (middle rating)", type: "textarea", required: true },
        { name: "option_c", label: "Option C (lowest rating)", type: "textarea", required: true },
      ],
      initial: { question: "", option_a: "", option_b: "", option_c: "" },
    };
  }
  const q = questions.find((x) => x.id === target.questionId);
  return {
    mode: "edit",
    title: `Question ${q?.id ?? ""}`,
    saveLabel: "Save question",
    fields: [
      { name: "question", label: "Question", type: "textarea", required: true },
      { name: "option_a", label: "Option A (best rating)", type: "textarea", required: true },
      { name: "option_b", label: "Option B (middle rating)", type: "textarea", required: true },
      { name: "option_c", label: "Option C (lowest rating)", type: "textarea", required: true },
    ],
    initial: {
      question: q?.question ?? "",
      option_a: q?.option_a ?? "",
      option_b: q?.option_b ?? "",
      option_c: q?.option_c ?? "",
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
