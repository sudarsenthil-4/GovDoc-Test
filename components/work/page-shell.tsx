import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { TONE_CLASSES, type UseCaseTone } from "./use-case-tone";

type Crumb = { label: string; href?: string };

export function WorkBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="mb-7 flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-2.5">
            {c.href && !isLast ? (
              <Link
                href={c.href as any}
                className="text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]"
              >
                {c.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-[var(--color-ink)]" : ""}>
                {c.label}
              </span>
            )}
            {!isLast && <span className="text-[var(--color-ink-faint)] opacity-60">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

type HeaderProps = {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  /** Optional accented suffix italicized in terracotta (e.g. title="Rubric" accent="Tools" → "Rubric Tools"). */
  accent?: string;
  blurb?: string;
  actions?: React.ReactNode;
  /** When set, ignores the default terracotta page icon and uses this use-case tone instead (legacy callers). */
  tone?: UseCaseTone;
};

export function WorkPageHeader({
  icon: Icon,
  eyebrow,
  title,
  accent,
  blurb,
  actions,
  tone,
}: HeaderProps) {
  const t = tone ? TONE_CLASSES[tone] : null;
  const iconWrap = t
    ? `flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${t.iconBg} ${t.ring}`
    : "flex size-11 shrink-0 items-center justify-center bg-[var(--color-govdoc-primary)] text-white";
  const iconFg = t ? t.iconFg : "text-white";

  return (
    <header className="mb-8 grid grid-cols-[auto_1fr_auto] items-start gap-6 border-b border-[var(--color-line)] pb-7">
      {Icon && (
        <div className={iconWrap}>
          <Icon className={`size-5 ${iconFg}`} strokeWidth={1.6} />
        </div>
      )}
      <div className="space-y-2.5">
        {eyebrow && (
          <div className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
            {eyebrow}
          </div>
        )}
        <h1
          className="leading-none tracking-[-0.025em] text-[var(--color-ink)]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(34px, 4vw, 48px)",
            fontVariationSettings: '"opsz" 96',
          }}
        >
          {title}
          {accent && (
            <>
              {" "}
              <em
                className="text-[var(--color-govdoc-primary)]"
                style={{ fontStyle: "italic", fontWeight: 300 }}
              >
                {accent}
              </em>
            </>
          )}
        </h1>
        {blurb && (
          <p className="max-w-[56ch] text-[15px] leading-[1.5] text-[var(--color-ink-mute)]">
            {blurb}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

export function WorkCard({
  title,
  description,
  children,
  footer,
  headerRight,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden border border-[var(--color-line)] bg-[var(--color-paper)]">
      {(title || description || headerRight) && (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line-soft)] px-6 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-[var(--color-ink-mute)]">{description}</p>
            )}
          </div>
          {headerRight && <div className="shrink-0">{headerRight}</div>}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-line-soft)] bg-[var(--color-cream-soft)] px-6 py-3.5">
          {footer}
        </div>
      )}
    </div>
  );
}
