"use client";
import { useState } from "react";
import type { ComponentType } from "react";
import type { RubricsManifestEntry } from "@/lib/usecases/rubrics-store";
import { RubricPicker } from "./shared/rubric-picker";
import { CreateRubricDialog, type CreateRubricInput } from "./shared/create-rubric-dialog";
import { ConfirmDialog, type ConfirmRequest } from "./shared/confirm-dialog";
import { RubricUploadModal } from "./rubric-upload-modal";
import { VersionHistoryPanel } from "./version-history-panel";

type Props<T> = {
  usecaseId: string;
  initialRubrics: readonly RubricsManifestEntry[];
  initialData: T;
  EditComponent: ComponentType<{ initial: T }>;
};

function pickInitialId(rubrics: readonly RubricsManifestEntry[]): string {
  const def = rubrics.find((r) => r.isDefault) ?? rubrics[0];
  return def?.id ?? "default";
}

export function EditTabContent<T>({
  usecaseId,
  initialRubrics,
  initialData,
  EditComponent,
}: Props<T>) {
  const [rubrics, setRubrics] = useState<readonly RubricsManifestEntry[]>(initialRubrics);
  const [selectedId, setSelectedId] = useState<string>(() => pickInitialId(initialRubrics));
  const [data, setData] = useState<T>(initialData);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  async function fetchRubricContent(rubricId: string): Promise<T> {
    const res = await fetch(
      `/api/usecases/${usecaseId}/rubric?rubric=${encodeURIComponent(rubricId)}`,
    );
    if (!res.ok) throw new Error(`Failed to load rubric (${res.status})`);
    return (await res.json()) as T;
  }

  async function fetchManifest(): Promise<RubricsManifestEntry[]> {
    const res = await fetch(`/api/usecases/${usecaseId}/rubrics`);
    if (!res.ok) throw new Error(`Failed to load rubrics list (${res.status})`);
    const body = (await res.json()) as { rubrics: RubricsManifestEntry[] };
    return body.rubrics;
  }

  async function withBusy<R>(fn: () => Promise<R>): Promise<R | null> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleSelect(id: string) {
    if (id === selectedId) return;
    await withBusy(async () => {
      const next = await fetchRubricContent(id);
      setSelectedId(id);
      setData(next);
    });
  }

  async function handleCreate(input: CreateRubricInput) {
    const created = await withBusy(async () => {
      const res = await fetch(`/api/usecases/${usecaseId}/rubrics`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Failed to create rubric (${res.status})`);
      }
      const list = await fetchManifest();
      const content = await fetchRubricContent(input.id);
      setRubrics(list);
      setSelectedId(input.id);
      setData(content);
      return true;
    });
    if (created) setShowCreate(false);
  }

  async function handleSetDefault(id: string) {
    await withBusy(async () => {
      const res = await fetch(
        `/api/usecases/${usecaseId}/rubrics/${encodeURIComponent(id)}/default`,
        { method: "PATCH" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Failed to set default (${res.status})`);
      }
      setRubrics(await fetchManifest());
    });
  }

  function requestDelete(id: string) {
    const entry = rubrics.find((r) => r.id === id);
    if (!entry) return;
    setConfirm({
      title: `Delete rubric "${entry.label}"?`,
      message: "This permanently removes the rubric and its saved content. Runs already in progress are not affected.",
      confirmLabel: "Delete rubric",
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        await withBusy(async () => {
          const res = await fetch(
            `/api/usecases/${usecaseId}/rubrics/${encodeURIComponent(id)}`,
            { method: "DELETE" },
          );
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error((body as { error?: string }).error ?? `Failed to delete rubric (${res.status})`);
          }
          const list = await fetchManifest();
          const fallback = list.find((r) => r.isDefault) ?? list[0];
          if (!fallback) throw new Error("Manifest empty after delete");
          const nextContent = await fetchRubricContent(fallback.id);
          setRubrics(list);
          setSelectedId(fallback.id);
          setData(nextContent);
        });
      },
    });
  }

  return (
    <div className="space-y-4">
      <RubricPicker
        rubrics={rubrics}
        selectedId={selectedId}
        onSelect={handleSelect}
        mode="manage"
        busy={busy}
        onCreateClick={() => setShowCreate(true)}
        onUploadClick={() => setShowUpload(true)}
        onSetDefault={handleSetDefault}
        onDelete={requestDelete}
      />
      {error && (
        <div className="rounded-md border border-l-4 border-destructive/30 border-l-destructive bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </div>
      )}
      {/* `key` forces a fresh mount when the selected rubric changes so the
          editor's internal state is replaced with the newly-loaded content. */}
      <EditComponent key={selectedId} initial={data} />

      <VersionHistoryPanel
        usecaseId={usecaseId}
        rubricId={selectedId}
        onChanged={async () => {
          await withBusy(async () => {
            // Restoring or deleting changes the live file; refetch content + manifest.
            const list = await fetchManifest();
            const content = await fetchRubricContent(selectedId);
            setRubrics(list);
            setData(content);
          });
        }}
      />

      {showCreate && (
        <CreateRubricDialog
          rubrics={rubrics}
          onCancel={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}
      {confirm && <ConfirmDialog request={confirm} onCancel={() => setConfirm(null)} />}
      <RubricUploadModal
        open={showUpload}
        usecaseId={usecaseId}
        rubricId={selectedId}
        onClose={() => setShowUpload(false)}
        onUploaded={async ({ rubricId: uploadedId }) => {
          setShowUpload(false);
          await withBusy(async () => {
            const list = await fetchManifest();
            const content = await fetchRubricContent(uploadedId);
            setRubrics(list);
            setSelectedId(uploadedId);
            setData(content);
          });
        }}
      />
    </div>
  );
}
