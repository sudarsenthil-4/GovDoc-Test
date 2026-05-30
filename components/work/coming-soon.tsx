import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { WorkBreadcrumbs, WorkPageHeader } from "@/components/work/page-shell";

type Props = {
  title: string;
  blurb: string;
  icon?: LucideIcon;
  backHref?: string;
};

export function ComingSoon({ title, blurb, icon, backHref }: Props) {
  return (
    <div className="space-y-6">
      {backHref ? (
        <WorkBreadcrumbs
          crumbs={[
            { label: "Workspace", href: backHref },
            { label: title },
          ]}
        />
      ) : null}

      <WorkPageHeader
        icon={icon}
        eyebrow="Coming Soon"
        title={title}
        blurb={blurb}
      />

      <div className="border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-8 py-14 text-center">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
          In development
        </p>
        <p className="mt-3 text-[13.5px] leading-[1.55] text-[var(--color-ink-mute)]">
          This workspace is being prepared. Check back soon.
        </p>
        {backHref ? (
          <Link
            href={backHref as any}
            className="mt-6 inline-flex items-center gap-2 border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-soft)] no-underline transition-colors hover:border-[var(--color-ink-soft)] hover:bg-[var(--color-cream-soft)] hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.6} />
            Back to dashboard
          </Link>
        ) : null}
      </div>
    </div>
  );
}
