export function RubricShell({
  description,
  intro,
  headerRight,
  children,
}: {
  // Short 1-2 sentence summary shown above the section list. All three rubric
  // views/edits should supply one so the layout reads identically.
  description?: string;
  // Escape hatch for richer intros (e.g. edit pages with action buttons).
  // Passing both `description` and `intro` is allowed; description renders first.
  intro?: React.ReactNode;
  // Optional slot pinned to the right of the description row (e.g. rubric
  // selector). Stacks below the description on narrow screens.
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {(description || headerRight) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          {description ? (
            <p className="max-w-[68ch] text-[13px] leading-[1.55] text-[var(--color-ink-mute)]">
              {description}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      {intro}
      <div className="flex flex-col border border-[var(--color-line)] bg-[var(--color-paper)]">
        {children}
      </div>
    </div>
  );
}
