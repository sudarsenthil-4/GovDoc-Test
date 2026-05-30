"use client";
import { useEffect, useRef, useState } from "react";
import type { RubricsManifestEntry } from "@/lib/usecases/rubrics-store";

type Props = {
  rubrics: readonly RubricsManifestEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
  // When mode === "manage", the picker also surfaces Create / Set-default /
  // Delete affordances. In "read-only" mode only the dropdown shows.
  mode: "read-only" | "manage";
  onCreateClick?: () => void;
  onUploadClick?: () => void;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  busy?: boolean;
};

export function RubricPicker({
  rubrics,
  selectedId,
  onSelect,
  mode,
  onCreateClick,
  onUploadClick,
  onSetDefault,
  onDelete,
  busy = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = rubrics.find((r) => r.id === selectedId) ?? rubrics[0];
  if (!selected) return null;

  const showAdminActions = mode === "manage" && !selected.isDefault;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
        Rubric
      </span>

      <div ref={ref} className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          <span>{selected.label}</span>
          {selected.isDefault && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
              Default
            </span>
          )}
          <svg
            aria-hidden="true"
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <div
            role="listbox"
            aria-label="Rubric"
            className="absolute left-0 top-full z-20 mt-1 min-w-[240px] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
          >
            {rubrics.map((r) => {
              const isActive = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setOpen(false);
                    if (!isActive) onSelect(r.id);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-muted ${
                    isActive ? "bg-muted/60 font-medium" : ""
                  }`}
                >
                  <span className="text-foreground">{r.label}</span>
                  {r.isDefault && (
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                      Default
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {mode === "manage" && onCreateClick && (
        <button
          type="button"
          onClick={onCreateClick}
          disabled={busy}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          + New rubric
        </button>
      )}

      {mode === "manage" && onUploadClick && (
        <button
          type="button"
          onClick={onUploadClick}
          disabled={busy}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Upload…
        </button>
      )}

      {showAdminActions && onSetDefault && (
        <button
          type="button"
          onClick={() => onSetDefault(selected.id)}
          disabled={busy}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Set as default
        </button>
      )}

      {showAdminActions && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(selected.id)}
          disabled={busy}
          className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
        >
          Delete rubric
        </button>
      )}
    </div>
  );
}
