"use client";

import { useEffect, useState } from "react";

type RubricEntry = {
  id: string;
  label: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
};

type VersionEntry = {
  id: string;
  createdAt: string;
  source: "edit" | "upload" | "clone" | "restore" | "seed";
  label?: string;
  note?: string;
};

export type RubricSelection = { rubricId: string; versionId: string | null };

export function RubricSelectorInline({
  usecaseId,
  onChange,
}: {
  usecaseId: string;
  onChange: (sel: RubricSelection) => void;
}) {
  const [rubrics, setRubrics] = useState<RubricEntry[]>([]);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [rubricId, setRubricId] = useState<string>("");
  const [versionId, setVersionId] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/usecases/${usecaseId}/rubrics`);
        if (!res.ok) throw new Error(`Failed to load rubrics (${res.status})`);
        const body = (await res.json()) as { rubrics: RubricEntry[] };
        if (!alive) return;
        setRubrics(body.rubrics);
        const def = body.rubrics.find((r) => r.isDefault) ?? body.rubrics[0];
        if (def) setRubricId(def.id);
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "Failed to load rubrics");
      }
    })();
    return () => {
      alive = false;
    };
  }, [usecaseId]);

  useEffect(() => {
    if (!rubricId) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/usecases/${usecaseId}/rubrics/${rubricId}/versions`);
        if (!res.ok) throw new Error(`Failed to load versions (${res.status})`);
        const body = (await res.json()) as { versions: VersionEntry[] };
        if (!alive) return;
        setVersions(body.versions);
        setVersionId("");
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "Failed to load versions");
      }
    })();
    return () => {
      alive = false;
    };
  }, [usecaseId, rubricId]);

  useEffect(() => {
    if (!rubricId) return;
    const effectiveVersionId = versionId || versions[0]?.id || null;
    onChange({ rubricId, versionId: effectiveVersionId });
  }, [rubricId, versionId, versions, onChange]);

  const latestId = versions[0]?.id;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {loadError && (
        <span role="alert" className="text-[11px] text-destructive">
          {loadError}
        </span>
      )}

      <label className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        Rubric
        <select
          aria-label="Rubric"
          value={rubricId}
          onChange={(e) => setRubricId(e.target.value)}
          className="rounded-lg border border-border bg-card px-2.5 py-1.5 font-sans text-sm font-normal normal-case tracking-normal text-foreground hover:bg-muted"
        >
          {rubrics.map((r) => {
            const showDefaultTag = r.isDefault && r.label.toLowerCase() !== "default";
            return (
              <option key={r.id} value={r.id}>
                {r.label}
                {showDefaultTag ? " · Default" : ""}
              </option>
            );
          })}
        </select>
      </label>

      <label className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
        Version
        <select
          aria-label="Version"
          value={versionId}
          onChange={(e) => setVersionId(e.target.value)}
          className="rounded-lg border border-border bg-card px-2.5 py-1.5 font-sans text-sm font-normal normal-case tracking-normal text-foreground hover:bg-muted"
        >
          <option value="">Latest{latestId ? ` (${latestId})` : ""}</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.id} — {new Date(v.createdAt).toLocaleDateString()}
              {v.note ? ` — ${v.note.slice(0, 32)}` : ""}
            </option>
          ))}
        </select>
      </label>

    </div>
  );
}
