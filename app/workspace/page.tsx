import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Search,
  FilePen,
  CheckCircle2,
  ScanText,
  Tag,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  BookOpenCheck,
} from "lucide-react";
import { verifySession } from "@/lib/auth/mock-session";
import { TopBar } from "@/components/shell/top-bar";
import { Tile } from "@/components/workspace/tile";

function displayName(user: string): string {
  const head = user.split(/[.@_-]/)[0] ?? user;
  return head.charAt(0).toUpperCase() + head.slice(1);
}

export default async function WorkspacePage() {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");

  const name = displayName(session.user);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cream)]">
      <TopBar user={session.user} />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-10 pb-16 pt-12 lg:pt-16">
        <header className="mb-10 lg:mb-14">
          <h1
            className="leading-[1.02] tracking-[-0.025em] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(48px, 6vw, 80px)",
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Welcome back,{" "}
            <em
              className="text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              {name}.
            </em>
          </h1>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          <Tile icon={Search} title="Search &" accent="Ask" href="/work/search" enabled featured />
          <Tile icon={FilePen} title="Draft &" accent="Generate" href="/work/draft" enabled />
          <Tile icon={CheckCircle2} title="Validate &" accent="Comply" href="/work/review" enabled />
          <Tile icon={ScanText} title="OCR &" accent="Extract" href="/work/ocr" enabled />
          <Tile icon={Tag} title="Classify &" accent="Tag" href="/work/classify" enabled />
          <Tile icon={AlertTriangle} title="Detect" accent="Risk" href="/work/detect-risk" enabled />
          <Tile icon={ClipboardList} title="Fill" accent="Forms" href="/work/fill-forms" enabled />
          <Tile icon={ShieldCheck} title="Audit &" accent="Trace" href="/work/audit" enabled />
          <Tile icon={BookOpenCheck} title="Policy &" accent="Standards" href="/work/policy" enabled />
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-10 py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>© 2026 LLM at Scale.AI</span>
            <Sep />
            <span>Confidential &amp; Proprietary</span>
            <Sep />
            <span>Authorized Use Only</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Section 508</span>
            <span>Support</span>
            <span>v 1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Sep() {
  return <span aria-hidden className="text-[var(--color-ink-faint)]/60">·</span>;
}
