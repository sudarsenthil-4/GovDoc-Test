import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";

export default function CoverPage() {
  return (
    <main className="min-h-screen bg-[#ebe8dc] text-[#11150f]">
      {/* TOP BLACK BAR */}
      <div className="flex h-9 items-center justify-center bg-[#07100b] font-mono text-[10px] uppercase tracking-[0.55em] text-[#e7e1c9]">
        <span className="mx-4 h-2 w-2 rounded-full bg-[#244f35]" />
        Policy Compliance Evaluation
        <span className="mx-6">·</span>
        Powered by Agentic AI
        <span className="mx-4 h-2 w-2 rounded-full bg-[#244f35]" />
      </div>

      {/* NAV BAR */}
      <header className="flex h-[70px] items-center justify-between border-b border-[#d8d3c4] bg-[#efebdf] px-12">
        <div className="flex items-center gap-8">
          <AppLogo size={28} />
          <div className="h-8 w-px bg-[#d8d3c4]" />

          <div className="flex items-center gap-3 text-[18px]">
            <span className="h-3 w-3 rotate-45 bg-[#234c35]" />
            <span className="font-serif">Policy Compliance · Agentic AI</span>
          </div>
        </div>

        <div className="flex items-center gap-7">
          <p className="font-serif text-[13px] italic text-[#33382f]">
            Reads. Checks. Decides.
          </p>

          <div className="rounded-full border border-[#d8d3c4] bg-[#f6f3ea] px-4 py-1 font-mono text-[10px] uppercase tracking-[0.25em]">
            ● v 1.0.0 Stable
          </div>

          <span className="font-mono text-[10px] uppercase tracking-[0.35em]">
            Request Demo
          </span>

          <Link
            href="/login"
            className="rounded-full bg-[#143b28] px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-white"
          >
            Sign In →
          </Link>
        </div>
      </header>

      {/* MAIN PAGE */}
      <section
        className="relative min-h-[calc(100vh-106px)] px-16 py-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(20, 40, 30, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 40, 30, 0.055) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* HERO */}
        <div className="max-w-[1100px]">
          <div className="mb-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.45em] text-[#28372c]">
            <span className="h-px w-8 bg-[#11150f]" />
            <span className="rounded border border-[#c8c1ad] bg-[#f6f3ea] px-2 py-1">
              00
            </span>
            Welcome · GovDoc Platform
          </div>

          <h1 className="max-w-[980px] font-serif text-[70px] font-bold leading-[0.95] tracking-[-0.045em] text-[#11150f]">
            GovDoc is{" "}
            <em className="font-normal italic text-[#234c35]">beyond</em>{" "}
            Microsoft 365 Copilot
            <span className="text-[#234c35]">.</span>
          </h1>

          <p className="mt-8 max-w-[760px] font-serif text-[22px] font-bold">
            Deterministic responses at low cost —{" "}
            <em className="font-normal italic text-[#234c35]">
              built to handle any complex document.
            </em>
          </p>

          <div className="my-14 h-px max-w-[1120px] bg-[#d8d3c4]" />
        </div>

        {/* READS CHECKS DECIDES SECTION */}
        <div className="grid grid-cols-[420px_1fr] gap-20">
          {/* LEFT TEXT */}
          <div>
            <div className="mb-8 inline-flex rounded-full border border-[#7d8a74] bg-[#e9eadf] px-5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-[#173b29]">
              ● Document Intelligence · Done Right
            </div>

            <h2 className="font-serif text-[50px] leading-[0.95] tracking-[-0.035em]">
              Reads. Checks.
              <br />
              <em className="font-normal italic text-[#234c35]">Decides.</em>
            </h2>

            <p className="mt-8 text-[19px] leading-[1.55] text-[#2c302b]">
              An <strong>agentic document-intelligence platform</strong> that
              reads complex documents, checks them against your policy, and
              tells you <em>pass or fail</em> — with the{" "}
              <strong>same verdict at the same cost</strong>, every time.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.28em]">
              <span className="rounded-full border border-[#d1c8b7] bg-[#f6f3ea] px-5 py-3">
                ✓ Deterministic
              </span>
              <span className="rounded-full border border-[#d1c8b7] bg-[#f6f3ea] px-5 py-3">
                ✓ Fixed Cost
              </span>
              <span className="rounded-full border border-[#d1c8b7] bg-[#f6f3ea] px-5 py-3">
                ✓ Fully Auditable
              </span>
            </div>
          </div>

          {/* RIGHT DIAGRAM */}
          <div className="flex items-center justify-center gap-8">
            {/* READS CARD */}
            <div className="text-center">
              <p className="mb-7 font-mono text-[10px] uppercase tracking-[0.4em] text-[#6e6b61]">
                01 · Reads
              </p>

              <div className="relative h-[175px] w-[145px] rounded border border-[#d6cbb8] bg-[#f8f5eb] p-4 shadow-lg">
                <div className="absolute right-0 top-0 h-8 w-8 bg-[#e4decd]" />
                <div className="mb-4 h-2 w-20 bg-[#11150f]" />
                <div className="space-y-2">
                  <div className="h-1.5 w-24 bg-[#8b8a7e]" />
                  <div className="h-1.5 w-28 bg-[#8b8a7e]" />
                  <div className="h-1.5 w-20 bg-[#8b8a7e]" />
                  <div className="h-5 w-28 rounded border border-[#b9a46f]" />
                  <div className="h-1.5 w-24 bg-[#8b8a7e]" />
                  <div className="h-1.5 w-20 bg-[#8b8a7e]" />
                  <div className="h-5 w-16 rounded border border-[#60936a]" />
                </div>
              </div>
            </div>

            <div className="font-mono text-[25px] text-[#234c35]">▶</div>

            {/* CHECKS CARD */}
            <div className="text-center">
              <p className="mb-7 font-mono text-[10px] uppercase tracking-[0.4em] text-[#6e6b61]">
                02 · Checks
              </p>

              <div className="rounded bg-[#07100b] p-5 text-left text-[#f2ead8] shadow-lg">
                <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#c9ac63]">
                  Agentic Engine
                </p>

                <p className="mt-2 font-serif text-[22px] italic">GovDoc</p>

                <ul className="mt-5 space-y-2 font-mono text-[10px]">
                  <li>● Extract Facts</li>
                  <li>● Apply Rubric</li>
                  <li>● Issue Verdict</li>
                </ul>

                <div className="mt-5 rounded border border-[#77733f] px-8 py-3 text-center font-serif italic">
                  Stable
                </div>
              </div>

              <div className="mt-3 rounded bg-black px-4 py-3 text-left font-serif text-[12px] italic text-white">
                Natural Language
                <br />
                “Did this filing meet the 45-day window?”
              </div>
            </div>

            <div className="font-mono text-[25px] text-[#234c35]">▶</div>

            {/* DECIDES CARD */}
            <div className="text-center">
              <p className="mb-7 font-mono text-[10px] uppercase tracking-[0.4em] text-[#6e6b61]">
                03 · Decides
              </p>

              <div className="w-[150px] rounded border-2 border-[#244f35] bg-[#f8f5eb] p-4 text-left shadow-lg">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-[#244f35]">
                  Verdict · Cited
                </p>

                <p className="mt-4 font-serif text-[21px] italic leading-none text-[#244f35]">
                  Procedural
                  <br />
                  breach.
                </p>

                <div className="mt-5 space-y-2 font-mono text-[9px]">
                  <div className="rounded border border-[#244f35] px-2 py-1">
                    Gov Code §11130
                  </div>
                  <div className="rounded border border-[#244f35] px-2 py-1">
                    CCR Title 2 §15.04(b)
                  </div>
                </div>

                <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.25em] text-[#8b8170]">
                  Recommendation
                </p>

                <div className="mt-2 rounded bg-[#244f35] py-2 text-center font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-white">
                  Tier-2 Review
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM COMPARISON CARD */}
        <div className="mt-16 rounded-lg border border-[#d8d3c4] bg-[#f5f1e6] p-9 shadow-sm">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.45em] text-[#7b7468]">
            Why Not Copilot
          </p>

          <h3 className="font-serif text-[25px]">
            GovDoc is <em className="text-[#8d2c27]">not</em> built on
            Microsoft 365 Copilot<span className="text-[#234c35]">.</span>
          </h3>

          <div className="mt-9 grid grid-cols-[1fr_80px_1fr] gap-8 text-[14px]">
            <div>
              <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-[#8d2c27]">
                M365 Copilot
              </p>

              <ul className="space-y-3 text-[#67665f]">
                <li>× Non-deterministic responses</li>
                <li>× Per-token pricing</li>
                <li>× Unauditable outputs</li>
              </ul>
            </div>

            <div className="flex items-center justify-center font-mono">→</div>

            <div>
              <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-[#244f35]">
                GovDoc
              </p>

              <ul className="space-y-3 text-[#2d332e]">
                <li>✓ Deterministic verdicts</li>
                <li>✓ Fixed cost</li>
                <li>✓ Full audit trail</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex h-11 items-center justify-between bg-[#07100b] px-8 font-mono text-[10px] uppercase tracking-[0.35em] text-[#d8c681]">
        <span>© 2026 LLMatScale.AI | Confidential & Proprietary</span>
        <span>Authorized Use Only</span>
        <span>🔒 TLS 1.3 | MFA | FedRAMP · CJIS · SOC 2</span>
      </footer>
    </main>
  );
}
