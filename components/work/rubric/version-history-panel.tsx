"use client";

import { useEffect, useState, useCallback } from "react";

type VersionEntry = {
  id: string;
  createdAt: string;
  source: "edit" | "upload" | "clone" | "restore" | "seed";
  label?: string;
  note?: string;
};

export function VersionHistoryPanel({
  usecaseId,
  rubricId,
  onChanged,
}: {
  usecaseId: string;
  rubricId: string;
  /** Fires after a restore or delete so the parent can refresh its editor state. */
  onChanged: () => void | Promise<void>;
}) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/usecases/${usecaseId}/rubrics/${rubricId}/versions`);
      if (!res.ok) throw new Error(`Failed to load versions (${res.status})`);
      const body = (await res.json()) as { versions: VersionEntry[] };
      setVersions(body.versions);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [usecaseId, rubricId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/usecases/${usecaseId}/rubrics/${rubricId}/versions`);
        if (!alive) return;
        if (!res.ok) throw new Error(`Failed to load versions (${res.status})`);
        const body = (await res.json()) as { versions: VersionEntry[] };
        if (!alive) return;
        setVersions(body.versions);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [usecaseId, rubricId]);

  async function handleRestore(versionId: string) {
    setBusyId(versionId);
    setError(null);
    try {
      const res = await fetch(
        `/api/usecases/${usecaseId}/rubrics/${rubricId}/versions/${versionId}/restore`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ note: `Restored from ${versionId}` }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error ?? `Restore failed (${res.status})`);
      await fetchVersions();
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(versionId: string) {
    if (!confirm(`Delete version ${versionId}? This cannot be undone.`)) return;
    setBusyId(versionId);
    setError(null);
    try {
      const res = await fetch(
        `/api/usecases/${usecaseId}/rubrics/${rubricId}/versions/${versionId}`,
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string }).error ?? `Delete failed (${res.status})`);
      await fetchVersions();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  const newestId = versions[0]?.id;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">Version history</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {versions.length} version{versions.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading && versions.length === 0 && (
        <p className="text-xs text-muted-foreground">Loading…</p>
      )}

      {error && (
        <div role="alert" className="mb-3 rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {!loading && versions.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">No history yet. Saving the rubric will start one.</p>
      )}

      {versions.length > 0 && (
        <ul className="space-y-1.5">
          {versions.map((v) => {
            const isNewest = v.id === newestId;
            const isOnly = versions.length === 1;
            const canDelete = !isNewest && !isOnly;
            const canRestore = !isNewest;
            return (
              <li
                key={v.id}
                className="flex flex-wrap items-center gap-3 rounded border border-border/60 bg-background/40 px-3 py-2 text-xs"
              >
                <span className="font-mono font-semibold text-foreground">{v.id}</span>
                <span className="text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {v.source}
                </span>
                {isNewest && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-primary">
                    current
                  </span>
                )}
                {v.note && <span className="text-muted-foreground">— {v.note}</span>}
                <span className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestore(v.id)}
                    disabled={!canRestore || busyId !== null}
                    className="rounded border border-border px-2 py-0.5 text-[11px] font-medium text-foreground transition hover:bg-muted disabled:opacity-40"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    disabled={!canDelete || busyId !== null}
                    className="rounded border border-destructive/40 px-2 py-0.5 text-[11px] font-medium text-destructive transition hover:bg-destructive/5 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
