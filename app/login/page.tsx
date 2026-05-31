import type { ReactNode } from "react";
import { AppLogo } from "@/components/brand/app-logo";
import { LoginForm } from "@/components/login/login-form";
import { getRandomLoginExample, type LoginExampleSegment } from "@/lib/login-examples";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const example = getRandomLoginExample();

  return (
    <main className="flex min-h-screen flex-col bg-[#F3EEE0] text-[#0E1410]">
      <TopBanner />
      <LoginHeader />

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[55fr_45fr]">
        <section className="govdoc-login-grid relative hidden overflow-hidden border-r border-[#D4CDB8] bg-[#F3EEE0] px-[68px] pb-10 pt-14 lg:block">
          <div className="relative z-10 flex h-full flex-col">
            <div className="mb-10 flex items-start justify-between gap-8">
              <h1
                className="leading-none tracking-[-0.04em] text-[#0E1410]"
                style={{ fontFamily: "var(--font-display)", fontSize: "88px", fontWeight: 400 }}
              >
                GovDoc<span className="inline-block h-4 w-4 bg-[#3D5740]" />
              </h1>
              <div className="mt-3 max-w-[210px] text-right">
                <p
                  className="text-[#3D5740]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "31px",
                    fontStyle: "italic",
                    fontWeight: 400,
                    lineHeight: 1,
                  }}
                >
                  Reads.
                </p>
                <p className="mt-2 font-mono text-[10px] font-semibold uppercase leading-5 tracking-[0.34em] text-[#6E706A]">
                  Checks the policy.
                  <br />
                  Tells you pass or fail.
                </p>
              </div>
            </div>

            <div className="grid min-h-[610px] flex-1 grid-cols-[58fr_42fr] overflow-hidden rounded-[4px] border border-[#D4CDB8] bg-[#FCFAF3] shadow-[0_22px_48px_rgba(14,20,16,0.10)]">
              <div className="col-span-2 flex items-center justify-between border-b border-[#D4CDB8] bg-[#F7F2E6] px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E706A]">
                  <DocumentIcon />
                  <span className="truncate">
                    {example.caseId} · {example.filename}
                  </span>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#DDE5D5] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3D5740]">
                  <span className="size-1.5 rounded-full bg-[#3D5740]" />
                  Agent Active · Analyzing
                </span>
              </div>

              <div className="relative border-r border-dashed border-[#D4CDB8] bg-[#FCFAF3] px-7 py-7">
                <p className="mb-6 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8B877D]">
                  — {example.pageLabel}
                </p>
                <div
                  className="max-w-[650px] text-[15px] leading-[1.65] text-[#3F423C]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {example.paragraphs.map((paragraph, index) => (
                    <p key={index} className={index < example.paragraphs.length - 1 ? "mb-4" : undefined}>
                      {paragraph.map((segment, segmentIndex) => (
                        <ExampleSegment key={segmentIndex} segment={segment} />
                      ))}
                    </p>
                  ))}
                </div>

                <div className="absolute bottom-16 left-7 right-7 flex items-center gap-3 rounded-[5px] bg-[#0E1410] px-4 py-3 font-mono text-[10.5px] font-semibold tracking-[0.18em] text-[#D7E0D0] shadow-[0_14px_30px_rgba(14,20,16,0.20)]">
                  <span className="size-1.5 rounded-full bg-[#9DBFA2]" />
                  <span>{example.crossReference}</span>
                </div>
              </div>

              <aside className="flex flex-col justify-between bg-[#F7F2E6] px-6 py-6">
                <div className="space-y-8">
                  <AnalysisBlock label="01" title="Extracted Facts">
                    <dl className="space-y-2 font-mono text-[11px]">
                      {example.facts.map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[92px_1fr] gap-3">
                          <dt className="text-[#8B877D]">{label}</dt>
                          <dd className="font-semibold text-[#0E1410]">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </AnalysisBlock>

                  <AnalysisBlock label="02" title="Reasoning Path">
                    <ol className="space-y-2 font-mono text-[11px] font-semibold text-[#0E1410]">
                      {example.reasoning.map((step, index) => (
                        <li key={step}>
                          <span className="mr-3 text-[#8B877D]">{String(index + 1).padStart(2, "0")}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </AnalysisBlock>
                </div>

                <div className="rounded-[5px] border-l-4 border-[#3D5740] bg-[#0E1410] px-5 py-4 text-[#FCFAF3]">
                  <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#AFC9B1]">
                    03 Verdict
                  </p>
                  <p className="text-[16px] leading-6" style={{ fontFamily: "var(--font-display)" }}>
                    {example.verdictPrefix}{" "}
                    <em className="italic text-[#AFC9B1]">{example.verdictEmphasis}</em>{" "}
                    {example.verdictSuffix}
                  </p>
                </div>
              </aside>
            </div>

            <div className="mt-8 flex items-end justify-between gap-8">
              <p
                className="max-w-[650px] border-l-2 border-[#3D5740] pl-4 text-[17px] italic leading-7 text-[#3F423C]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Reads the document. Checks the policy. Tells you pass or fail — with full citations and audit trail.
              </p>
              <div className="text-right font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3D5740]">
                <p className="text-[#0E1410]">Powered by</p>
                <p className="text-[#6E706A]">Anthropic Claude</p>
                <p className="mt-1 inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#3D5740]" />
                  Authorized Partner
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex flex-col overflow-hidden border-l border-[#D4CDB8] bg-[#FCFAF3] px-6 pb-8 pt-11 sm:px-10 lg:px-[76px]">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#FCFAF3]" />
          <div
            aria-hidden
            className="pointer-events-none absolute left-[13%] top-0 z-10 hidden h-[130%] w-px rotate-[7deg] bg-[#3D5740]/25 lg:block"
          />

          <div className="relative z-20">
            <div className="mb-10 grid grid-cols-[1fr_auto_1fr_auto_1fr] border-b border-[#D4CDB8] pb-8">
              <Metric
                label="01"
                title="Reads"
                subtitle={
                  <>
                    Government
                    <br />
                    Documents
                  </>
                }
              />
              <div className="mx-5 w-px bg-[#D4CDB8]" />
              <Metric
                label="02"
                title="Checks"
                subtitle={
                  <>
                    Against
                    <br />
                    Policy
                  </>
                }
              />
              <div className="mx-5 w-px bg-[#D4CDB8]" />
              <Metric
                label="03"
                title="Decides"
                subtitle={
                  <>
                    Pass / Fail
                    <br />
                    With Audit
                  </>
                }
              />
            </div>

            <div className="mx-auto flex w-full max-w-[775px] flex-col justify-center">
              <div className="mb-7 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.34em] text-[#3D5740]">
                <span className="h-px w-10 bg-[#0E1410]" />
                <LockIcon />
                Secure Portal
              </div>

              <h2
                className="tracking-[-0.035em] text-[#0E1410]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(52px, 4.8vw, 68px)",
                  lineHeight: 1.05,
                  fontWeight: 400,
                }}
              >
                Sign in to{" "}
                <em className="italic text-[#3D5740]" style={{ fontWeight: 300 }}>
                  continue.
                </em>
              </h2>

              <div className="my-8 flex items-center gap-2">
                <span className="h-[2px] flex-[0.6] bg-[#3D5740]" />
                <span className="size-1 rounded-full bg-[#3D5740]" />
                <span className="h-px flex-1 bg-[#D4CDB8]" />
              </div>

              <LoginForm />
            </div>
          </div>

          <div className="relative z-20 mt-auto flex items-center justify-between border-t border-[#D4CDB8] pt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8B877D]">
            <span>Authorized Use Only</span>
            <span>TLS 1.3 · MFA</span>
          </div>
        </section>
      </div>

      <LoginFooter />
    </main>
  );
}

function TopBanner() {
  return (
    <div className="flex h-[38px] items-center justify-center gap-5 bg-[#0E1410] px-4 font-mono text-[11px] font-bold uppercase tracking-[0.5em] text-[#C8D1C1]">
      <span className="size-2 rounded-full bg-[#9DBFA2] shadow-[0_0_0_3px_rgba(157,191,162,0.22)]" />
      <span className="text-center">Policy Compliance Evaluation · Powered by Agentic AI</span>
      <span className="size-2 rounded-full bg-[#9DBFA2] shadow-[0_0_0_3px_rgba(157,191,162,0.22)]" />
    </div>
  );
}

function LoginHeader() {
  return (
    <header className="border-b border-[#D4CDB8] bg-[#F7F2E6]">
      <div className="flex h-[102px] items-center justify-between px-10">
        <div className="flex items-center gap-5">
          <AppLogo size={58} />
          <span className="h-12 w-px bg-[#D4CDB8]" />
          <span className="size-3 rotate-45 bg-[#3D5740]" />
          <span
            className="text-[#0E1410]"
            style={{ fontFamily: "var(--font-display)", fontSize: "25px", fontWeight: 650 }}
          >
            Policy Compliance · Agentic AI
          </span>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <span className="text-[15px] italic text-[#6E706A]" style={{ fontFamily: "var(--font-display)" }}>
            Reads. Checks. Decides.
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D4CDB8] bg-[#FCFAF3] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[#6E706A]">
            <span className="size-1.5 rounded-full bg-[#3D5740]" />
            v 1.0.0 stable
          </span>
        </div>
      </div>
    </header>
  );
}

function LoginFooter() {
  return (
    <footer className="flex min-h-[60px] flex-wrap items-center justify-between gap-4 border-t border-[#1C221D] bg-[#0E1410] px-10 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#E7E6D8]">
      <div className="flex items-center gap-6">
        <span>© 2026 LLMatScale.ai</span>
        <span className="h-6 w-px bg-[#E7E6D8]/30" />
        <span className="text-[#E7E6D8]/70">Confidential &amp; Proprietary</span>
      </div>
      <span className="hidden tracking-[0.5em] text-[#C8D1C1] md:inline">Authorized Use Only</span>
      <div className="flex items-center gap-5">
        <span className="inline-flex items-center gap-1.5">
          <LockIcon /> TLS 1.3
        </span>
        <span className="h-6 w-px bg-[#E7E6D8]/30" />
        <span>✓ MFA</span>
        <span className="h-6 w-px bg-[#E7E6D8]/30" />
        <span>FedRAMP · CJIS · SOC 2</span>
      </div>
    </footer>
  );
}

function ExampleSegment({ segment }: { segment: LoginExampleSegment }) {
  if (segment.tone === "highlight") {
    return <span className="rounded-sm bg-[rgba(61,87,64,0.20)] px-1 text-[#0E1410]">{segment.text}</span>;
  }

  if (segment.tone === "strong") {
    return <strong>{segment.text}</strong>;
  }

  return <>{segment.text}</>;
}

function AnalysisBlock({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] bg-[rgba(61,87,64,0.18)] px-1.5 font-mono text-[9px] font-bold text-[#3D5740]">
          {label}
        </span>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6E706A]">
          {title}
        </span>
      </div>
      {children}
    </section>
  );
}

function Metric({ label, title, subtitle }: { label: string; title: string; subtitle: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-1">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#3D5740]">{label}</span>
      <span
        className="text-[#0E1410]"
        style={{ fontFamily: "var(--font-display)", fontSize: "31px", fontWeight: 400, lineHeight: 1 }}
      >
        {title}
        <span className="text-[#3D5740]">.</span>
      </span>
      <span className="font-mono text-[10px] font-semibold uppercase leading-4 tracking-[0.22em] text-[#8B877D]">
        {subtitle}
      </span>
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 2.5h5l3 3V13.5H4z" />
      <path d="M9 2.5v3h3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
