import { AppLogo } from "@/components/brand/app-logo";
import { LoginForm } from "@/components/login/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
      {/* ============ LEFT ============ */}
      <section className="relative hidden flex-col overflow-hidden bg-[var(--color-cream)] px-16 py-9 lg:flex">
        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(10,10,10,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Soft radial wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 20% 100%, rgba(176,74,47,0.06), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 0%, rgba(10,10,10,0.05), transparent 60%)",
          }}
        />

        {/* Document watermark SVG */}
        <svg
          aria-hidden
          viewBox="0 0 400 520"
          fill="none"
          stroke="#0a0a0a"
          strokeWidth="1.5"
          className="pointer-events-none absolute right-[-60px] top-1/2 z-[1] h-auto w-[480px] -translate-y-1/2 -rotate-[5deg] opacity-[0.07] mix-blend-multiply"
        >
          <path d="M40 20 L320 20 L380 80 L380 500 L40 500 Z" strokeLinejoin="miter" />
          <path d="M320 20 L320 80 L380 80" />
          <rect x="70" y="60" width="180" height="10" />
          <rect x="70" y="80" width="120" height="6" />
          <circle cx="320" cy="180" r="40" strokeWidth="1.2" />
          <circle cx="320" cy="180" r="32" strokeWidth="0.8" />
          <path
            d="M310 175 L317 182 L332 167"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <line x1="70" y1="140" x2="260" y2="140" />
          <line x1="70" y1="156" x2="270" y2="156" />
          <line x1="70" y1="172" x2="240" y2="172" />
          <line x1="70" y1="188" x2="255" y2="188" />
          <line x1="70" y1="204" x2="220" y2="204" />
          <line x1="70" y1="240" x2="350" y2="240" strokeWidth="1" />
          <rect x="70" y="260" width="100" height="8" />
          <line x1="70" y1="290" x2="350" y2="290" />
          <line x1="70" y1="306" x2="340" y2="306" />
          <line x1="70" y1="322" x2="320" y2="322" />
          <line x1="70" y1="338" x2="345" y2="338" />
          <line x1="70" y1="354" x2="280" y2="354" />
          <line x1="70" y1="370" x2="330" y2="370" />
          <line x1="70" y1="386" x2="310" y2="386" />
          <line x1="70" y1="430" x2="180" y2="430" strokeWidth="1.2" />
          <rect x="70" y="438" width="60" height="4" />
          <line x1="220" y1="430" x2="330" y2="430" strokeWidth="1.2" />
          <rect x="220" y="438" width="60" height="4" />
          <line x1="70" y1="475" x2="350" y2="475" strokeWidth="0.8" />
        </svg>

        {/* Top brand bar — extends edge-to-edge so logo can sit at the left edge and Operational at the right edge */}
        <header className="relative z-10 -mx-16 flex items-center justify-between border-b border-[var(--color-line)] px-8 pb-6">
          <div className="flex items-center gap-3.5">
            <AppLogo size={36} />
            <div className="h-6 w-px bg-[var(--color-line)]" />
            <span
              className="text-[19px] font-medium tracking-[-0.015em] text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 96' }}
            >
              Gov<em className="font-light not-italic text-[var(--color-govdoc-primary)] [font-style:italic] [font-weight:300]">Doc</em>
            </span>
            <span className="relative ml-1 hidden whitespace-nowrap pl-[18px] font-mono text-[10.5px] uppercase leading-none tracking-[0.1em] text-[var(--color-ink-mute)] before:absolute before:left-0 before:top-1/2 before:h-[22px] before:w-px before:-translate-y-1/2 before:bg-[var(--color-line)] xl:inline">
              Agentic Document Intelligence{" "}
              <em className="font-medium not-italic text-[var(--color-govdoc-primary)]">
                · Built for Government
              </em>
            </span>
          </div>
          <div className="flex items-center gap-7 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
            <span className="inline-flex items-center gap-2">
              <span className="relative inline-block size-1.5 rounded-full bg-[#2d8c4a] shadow-[0_0_0_3px_rgba(45,140,74,0.18)] animate-[pulse_2.4s_ease-in-out_infinite]" />
              Operational
            </span>
          </div>
        </header>

        {/* Centered wordmark */}
        <div className="relative z-10 flex flex-1 flex-col items-start justify-center">
          <div
            className="leading-[0.88] tracking-[-0.045em] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(72px, 10.5vw, 156px)",
              fontVariationSettings: '"opsz" 144',
            }}
          >
            Gov
            <em
              className="text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              Doc
            </em>
            .
          </div>
          <div className="mb-[22px] mt-7 h-px w-16 bg-[var(--color-ink)]" />
          <h1
            className="m-0 max-w-[18ch] leading-[1.1] tracking-[-0.018em] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(26px, 2.4vw, 34px)",
              fontVariationSettings: '"opsz" 96',
            }}
          >
            Document Intelligence.
            <br />
            <em
              className="text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              Built for Government.
            </em>
          </h1>
          <div className="mt-[22px] font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
            For Government · Est. 2026
          </div>
        </div>

        {/* Bottom legal */}
        <footer className="relative z-10 mt-auto flex items-center justify-between border-t border-[var(--color-line)] pt-7 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          <span>© 2026 LLM at Scale.AI</span>
          <span>Confidential &amp; Proprietary</span>
        </footer>
      </section>

      {/* ============ RIGHT ============ */}
      <section className="relative flex flex-col bg-[var(--color-paper)] px-6 py-9 sm:px-10 lg:px-16">
        <div className="flex items-center justify-end border-b border-[var(--color-line-paper)] pb-6 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
          <span>v 1.0.0</span>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
          <div className="mb-6 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] before:h-px before:w-[18px] before:bg-[var(--color-ink-faint)] before:content-['']">
            Secure Portal
          </div>

          <h2
            className="mb-9 leading-[1.02] tracking-[-0.025em] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: 40,
              fontVariationSettings: '"opsz" 96',
            }}
          >
            Sign in to{" "}
            <em
              className="text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              continue.
            </em>
          </h2>

          <LoginForm />
        </div>

        <footer className="mt-auto flex items-center justify-between border-t border-[var(--color-line-paper)] pt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          <span>Authorized Use Only</span>
          <span>TLS 1.3 · MFA</span>
        </footer>
      </section>
    </div>
  );
}
