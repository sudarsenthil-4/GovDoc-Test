export function SectionCountChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
      {children}
    </span>
  );
}
