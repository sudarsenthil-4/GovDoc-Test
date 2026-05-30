import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

type Props = {
  title: string;
  accent: string;
  href: string;
  enabled: boolean;
  icon?: LucideIcon;
  featured?: boolean;
};

export function Tile({ title, accent, href, enabled, icon: Icon, featured = false }: Props) {
  const iconBg = featured ? "bg-[var(--color-govdoc-primary)]" : "bg-[var(--color-ink)]";
  const hasAmp = /\s*&\s*$/.test(title);
  const titleHead = title.replace(/\s*&\s*$/, "");
  const card = (
    <div
      className={`group relative flex h-full flex-col gap-4 border border-[var(--color-line)] bg-[var(--color-paper)] p-5 transition-all ${
        enabled
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-[var(--color-ink-soft)] hover:bg-[var(--color-cream-soft)]"
          : "opacity-70"
      }`}
    >
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={`flex size-9 items-center justify-center text-white ${iconBg}`}>
            <Icon className="size-[18px]" strokeWidth={1.7} />
          </div>
        )}
        {!enabled && (
          <span className="border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            Coming soon
          </span>
        )}
      </div>

      <h3
        className="leading-[1.2] tracking-[-0.012em] text-[var(--color-ink)]"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: 18,
          fontVariationSettings: '"opsz" 48',
        }}
      >
        {titleHead}{" "}
        <em
          className="text-[var(--color-govdoc-primary)]"
          style={{ fontStyle: "italic", fontWeight: 400 }}
        >
          {hasAmp ? <>&amp; {accent}</> : accent}
        </em>
      </h3>

      {enabled && (
        <span className="mt-auto flex size-7 items-center justify-center rounded-full border border-dotted border-[var(--color-ink-faint)] text-[var(--color-ink-mute)] transition-all group-hover:translate-x-0.5 group-hover:border-solid group-hover:border-[var(--color-govdoc-primary)] group-hover:bg-[var(--color-govdoc-primary)] group-hover:text-white">
          <ArrowRight className="size-3" strokeWidth={1.6} />
        </span>
      )}
    </div>
  );

  return enabled ? (
    <Link href={href as any} className="block h-full">
      {card}
    </Link>
  ) : (
    <div className="h-full">{card}</div>
  );
}
