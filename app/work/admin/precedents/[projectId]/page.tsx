"use client";
import { use, useEffect, useState } from "react";
import { WorkBreadcrumbs, WorkCard, WorkPageHeader } from "@/components/work/page-shell";
import { PrecedentsAdminTable } from "@/components/work/cucp/precedents-admin-table";
import type { PrecedentsByLevel } from "@/lib/usecases/cucp-reevals/memory/precedents";

export default function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [data, setData] = useState<PrecedentsByLevel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch(`/api/usecases/cucp-reevals/projects/${encodeURIComponent(projectId)}/precedents`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return (await res.json()) as PrecedentsByLevel;
      })
      .then((db) => {
        if (alive) {
          setData(db);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load precedents");
        }
      });
    return () => {
      alive = false;
    };
  }, [projectId, reloadKey]);

  async function onDelete(level: 1 | 2 | 3, index: number) {
    if (!window.confirm(`Delete this level-${level} precedent permanently?`)) return;
    const res = await fetch(`/api/usecases/cucp-reevals/projects/${encodeURIComponent(projectId)}/precedents`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ level, index }),
    });
    if (res.ok) setReloadKey((k) => k + 1);
    else setError(await res.text());
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <WorkBreadcrumbs
        crumbs={[
          { label: "Workspace", href: "/workspace" },
          { label: "Admin" },
          { label: `Precedents · ${projectId}` },
        ]}
      />
      <WorkPageHeader
        title={`Institutional Memory — ${projectId}`}
        eyebrow="Precedents Admin"
      />
      {error ? (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {!data ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <WorkCard title="Level 1 — Fact Extraction">
            <PrecedentsAdminTable
              level={1}
              precedents={data.level_1_precedents}
              onDelete={(i) => onDelete(1, i)}
            />
          </WorkCard>
          <WorkCard title="Level 2 — Legal Classifications">
            <PrecedentsAdminTable
              level={2}
              precedents={data.level_2_precedents}
              onDelete={(i) => onDelete(2, i)}
            />
          </WorkCard>
          <WorkCard title="Level 3 — Evidentiary Thresholds">
            <PrecedentsAdminTable
              level={3}
              precedents={data.level_3_precedents}
              onDelete={(i) => onDelete(3, i)}
            />
          </WorkCard>
        </>
      )}
    </main>
  );
}
