"use client";
import { useEffect, useRef, useState } from "react";

export function CreateNewMenu({
  label = "Create new",
  options,
  onPick,
}: {
  label?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onPick: (value: string) => void;
}) {
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

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)]"
      >
        {label}
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
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitem"
              disabled={o.disabled}
              onClick={() => {
                if (o.disabled) return;
                setOpen(false);
                onPick(o.value);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
