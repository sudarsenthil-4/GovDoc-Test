import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";

type Props = {
  user: string;
};

export function TopBar({ user }: Props) {
  const initial =
    user
      .split(/[.\s@_-]+/)
      .filter(Boolean)[0]?.[0]
      ?.toUpperCase() ?? "?";
  const display = user.split("@")[0]?.split(/[._]/)[0] ?? user;
  const displayCap = display.charAt(0).toUpperCase() + display.slice(1);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper)] px-10 py-[18px]">
      <div className="flex items-center gap-[18px]">
        <Link
          href={"/workspace" as any}
          className="flex items-center gap-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-govdoc-primary)]/40"
        >
          <AppLogo size={44} />
          <div className="h-[22px] w-px bg-[var(--color-line)]" />
          <span
            className="text-[18px] font-medium tracking-[-0.015em] text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 96' }}
          >
            Gov
            <em
              className="text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              Doc
            </em>
          </span>
        </Link>
        <span className="relative ml-1 hidden whitespace-nowrap pl-[18px] font-mono text-[10.5px] uppercase leading-none tracking-[0.1em] text-[var(--color-ink-mute)] before:absolute before:left-0 before:top-1/2 before:h-[22px] before:w-px before:-translate-y-1/2 before:bg-[var(--color-line)] xl:inline">
          Agentic Document Intelligence{" "}
          <em className="font-medium not-italic text-[var(--color-govdoc-primary)]">
            · Built for Government
          </em>
        </span>
      </div>

      <div className="flex items-center gap-[18px]">
        <div className="flex items-center gap-2.5 border border-[var(--color-line)] bg-[var(--color-cream-soft)] py-1.5 pl-1.5 pr-3.5">
          <div
            className="flex size-[26px] items-center justify-center bg-[var(--color-govdoc-primary)] text-[13px] font-medium text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {initial}
          </div>
          <span className="text-[12.5px] font-medium text-[var(--color-ink)]">{displayCap}</span>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            title="Sign out"
            className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-3"
            >
              <path d="M10 11.5 13.5 8 10 4.5M13 8H6M6 2H3.5C2.7 2 2 2.7 2 3.5v9c0 .8.7 1.5 1.5 1.5H6" />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
