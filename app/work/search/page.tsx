import Link from "next/link";
import { Search } from "lucide-react";
import { WorkBreadcrumbs, WorkPageHeader } from "@/components/work/page-shell";

const TOOLS = [
  {
    num: "01",
    title: "Review",
    accent: "Rubrics",
    blurb: "Browse the production rubric. Read-only.",
    tag: "Read-only · Versioned",
    tagLive: false,
    href: "/work/search/preview",
    enabled: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="round">
        <path d="M3 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z" />
        <path d="M21 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Manage",
    accent: "Rubrics",
    blurb: "Adjust questions, options, and weights. Every change logged.",
    tag: "Governed · Audit-logged",
    tagLive: true,
    href: "/work/search/edit",
    enabled: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="round">
        <path d="m4 20 1-4L17 4l3 3L8 19z" />
        <path d="m14 7 3 3" />
      </svg>
    ),
  },
] as const;

export default function SearchAskPage() {
  return (
    <div>
      <WorkBreadcrumbs
        crumbs={[
          { label: "Workspace", href: "/workspace" },
          { label: "Search & Ask" },
          { label: "Rubric Tools" },
        ]}
      />

      <WorkPageHeader
        icon={Search}
        eyebrow="Search & Ask"
        title="Rubric"
        accent="Tools"
        blurb="Inspect and tailor the rubrics behind every review."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {TOOLS.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href as any}
            className="group flex h-full flex-col border border-[var(--color-line)] bg-[var(--color-paper)] px-7 pb-6 pt-7 text-inherit no-underline transition-all hover:-translate-y-0.5 hover:border-[var(--color-ink-soft)] hover:bg-[var(--color-cream-soft)]"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="flex size-9 items-center justify-center bg-[var(--color-ink)] text-[var(--color-cream)]">
                <span className="size-[18px]">{opt.icon}</span>
              </div>
              <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-[var(--color-ink-faint)]">
                {opt.num}
              </span>
            </div>
            <h3
              className="mb-2 leading-[1.15] tracking-[-0.015em] text-[var(--color-ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 22,
                fontVariationSettings: '"opsz" 96',
              }}
            >
              {opt.title}{" "}
              <em
                className="text-[var(--color-govdoc-primary)]"
                style={{ fontStyle: "italic", fontWeight: 400 }}
              >
                {opt.accent}
              </em>
            </h3>
            <p className="mb-6 flex-1 text-[13.5px] leading-[1.5] text-[var(--color-ink-mute)]">
              {opt.blurb}
            </p>
            <div className="flex items-center justify-between border-t border-[var(--color-line-soft)] pt-4">
              <span
                className={`font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                  opt.tagLive ? "text-[var(--color-govdoc-primary)]" : "text-[var(--color-ink-faint)]"
                }`}
              >
                {opt.tag}
              </span>
              <span className="flex size-7 items-center justify-center rounded-full border border-dotted border-[var(--color-ink-soft)] bg-[var(--color-cream)] text-[var(--color-ink-soft)] transition-all group-hover:translate-x-1 group-hover:border-white group-hover:bg-[var(--color-govdoc-primary)] group-hover:text-white">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeDasharray="2 2" className="size-3">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
