"use client";
import { useEffect, useRef } from "react";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  request,
  onCancel,
}: {
  request: ConfirmRequest;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const confirmClass = request.danger
    ? "rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-1.5 text-sm font-semibold text-destructive transition hover:bg-destructive/20"
    : "rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={request.title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xl"
      >
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {request.title}
        </h3>
        <p className="text-[13px] leading-[1.55] text-muted-foreground">
          {request.message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
          >
            {request.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={request.onConfirm}
            className={confirmClass}
          >
            {request.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
