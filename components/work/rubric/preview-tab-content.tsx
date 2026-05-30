"use client";
import { useState } from "react";
import type { ComponentType } from "react";
import type { RubricsManifestEntry } from "@/lib/usecases/rubrics-store";
import { RubricPicker } from "./shared/rubric-picker";

type Props<T> = {
  usecaseId: string;
  rubrics: readonly RubricsManifestEntry[];
  initialData: T;
  View: ComponentType<{ data: T; headerRight?: React.ReactNode }>;
};

function pickInitialId(rubrics: readonly RubricsManifestEntry[]): string {
  const def = rubrics.find((r) => r.isDefault) ?? rubrics[0];
  return def?.id ?? "default";
}

export function PreviewTabContent<T>({ usecaseId, rubrics, initialData, View }: Props<T>) {
  const [selectedId, setSelectedId] = useState<string>(() => pickInitialId(rubrics));
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/usecases/${usecaseId}/rubric?rubric=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`Failed to load rubric (${res.status})`);
      const next = (await res.json()) as T;
      setData(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-l-4 border-destructive/30 border-l-destructive bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
          {error}
        </div>
      )}
      <View
        data={data}
        headerRight={
          <RubricPicker
            rubrics={rubrics}
            selectedId={selectedId}
            onSelect={handleSelect}
            mode="read-only"
            busy={loading}
          />
        }
      />
    </div>
  );
}
