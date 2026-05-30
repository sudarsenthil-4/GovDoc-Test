"use client";
import { useState } from "react";
import { SectionCountChip } from "./section-count-chip";

export type RubricSectionProps = {
  sectionKey?: string;
  title: string;
  count: number;
  countLabel?: string; // e.g. "questions", "criteria", "tiers"; default "items"
  defaultOpen?: boolean;
  // Optional weight as a 0-1 fraction. Rendered as a small "· NN%" suffix in
  // the section header chip. Only CMGC sections have weights today; CUCP/ROW
  // omit this and the chip falls back to just the count label.
  weight?: number;
  // When true, render the section header in body-text typography so the
  // component fits inside other cards (Preview rubric slide-down). Default
  // (false) keeps the larger display-font heading used on the standalone
  // Edit Rubrics page.
  compact?: boolean;
  children: React.ReactNode;
};

export function RubricSection({
  sectionKey,
  title,
  count,
  countLabel = "item",
  defaultOpen = false,
  weight,
  compact = false,
  children,
}: RubricSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const countLine = `${count} ${countLabel}${count === 1 ? "" : "s"}`;
  const label =
    typeof weight === "number" ? `${countLine} · ${Math.round(weight * 100)}%` : countLine;
  const buttonClass = compact
    ? "grid w-full cursor-pointer select-none grid-cols-[20px_1fr_auto_auto] items-center gap-3 border-none bg-transparent px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-cream-soft)]"
    : "grid w-full cursor-pointer select-none grid-cols-[24px_1fr_auto_auto] items-center gap-[18px] border-none bg-transparent px-6 py-[18px] text-left transition-colors hover:bg-[var(--color-cream-soft)]";
  const titleClass = compact
    ? "text-sm font-semibold leading-[1.3] tracking-[-0.005em] text-[var(--color-ink)]"
    : "text-[17px] font-medium leading-[1.2] tracking-[-0.012em] text-[var(--color-ink)]";
  const bodyClass = open
    ? compact
      ? "px-3 pb-3 pl-[44px]"
      : "px-6 pb-[22px] pl-[66px]"
    : "hidden";
  return (
    <div className="border-b border-[var(--color-line-soft)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={buttonClass}
      >
        <span className="font-mono text-[12px] font-semibold tracking-[0.1em] text-[var(--color-govdoc-primary)]">
          {sectionKey ?? ""}
        </span>
        <span
          className={titleClass}
          style={compact ? undefined : { fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 48' }}
        >
          {title}
        </span>
        <SectionCountChip>{label}</SectionCountChip>
        <span
          className={`flex transition-all ${
            open ? "rotate-90 text-[var(--color-govdoc-primary)]" : "text-[var(--color-ink-mute)]"
          }`}
          aria-hidden
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" className="size-3.5">
            <path d="m6 4 4 4-4 4" />
          </svg>
        </span>
      </button>
      <div
        className={bodyClass}
        style={open ? undefined : { display: "none" }}
      >
        {children}
      </div>
    </div>
  );
}
