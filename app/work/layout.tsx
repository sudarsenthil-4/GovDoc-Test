import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/mock-session";
import { TopBar } from "@/components/shell/top-bar";

export default async function WorkLayout({ children }: { children: React.ReactNode }) {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");
  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--color-cream-soft)] text-[var(--color-ink)]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(10,10,10,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.025) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        backgroundAttachment: "fixed",
      }}
    >
      <TopBar user={session.user} />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-10 py-8">{children}</main>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--color-line)] bg-[var(--color-paper)] px-10 py-6 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        <div className="flex items-center gap-[18px]">
          <span>© 2026 LLM at Scale.AI</span>
          <span className="size-[3px] rounded-full bg-[var(--color-ink-faint)]" />
          <span>Confidential &amp; Proprietary</span>
          <span className="size-[3px] rounded-full bg-[var(--color-ink-faint)]" />
          <span>Authorized Use Only</span>
        </div>
        <div className="flex flex-wrap items-center gap-[22px]">
          <a href="#" className="text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]">
            Privacy
          </a>
          <a href="#" className="text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]">
            Terms
          </a>
          <a href="#" className="text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]">
            Section 508
          </a>
          <a href="#" className="text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]">
            Support
          </a>
          <span>v 1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
