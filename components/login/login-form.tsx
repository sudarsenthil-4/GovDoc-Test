"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Invalid credentials");
      return;
    }
    router.push("/workspace");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <div className="relative">
        <div className="mb-2.5 flex items-baseline justify-between">
          <label
            htmlFor="email"
            className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]"
          >
            Agency Email
          </label>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
            Required
          </span>
        </div>
        <div className="relative border border-[var(--color-line-paper)] bg-[var(--color-field-bg)] transition-all hover:border-[#d4d2c7] focus-within:border-[var(--color-ink)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-mute)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3.5" width="12" height="9" rx="1" />
              <path d="m2.5 4.5 5.5 4 5.5-4" />
            </svg>
          </span>
          <input
            id="email"
            name="email"
            type="text"
            inputMode="email"
            placeholder="name@agency.gov"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-none bg-transparent px-4 py-4 pl-[46px] text-[15px] tracking-[-0.005em] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          />
        </div>
      </div>

      {/* Password */}
      <div className="relative">
        <div className="mb-2.5 flex items-baseline justify-between">
          <label
            htmlFor="password"
            className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-soft)]"
          >
            Password
          </label>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
            <a
              href="#"
              className="text-[var(--color-ink-soft)] underline underline-offset-2 hover:text-[var(--color-ink)]"
            >
              Reset →
            </a>
          </span>
        </div>
        <div className="relative border border-[var(--color-line-paper)] bg-[var(--color-field-bg)] transition-all hover:border-[#d4d2c7] focus-within:border-[var(--color-ink)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-mute)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="8" r="3" />
              <path d="M9 8h5M12 8v2.5M14 8v1.5" />
            </svg>
          </span>
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••••••"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-none bg-transparent px-4 py-4 pl-[46px] pr-12 text-[15px] tracking-[-0.005em] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
          />
          <button
            type="button"
            aria-label={showPw ? "Hide" : "Show"}
            aria-controls="password"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3.5 top-1/2 flex -translate-y-1/2 cursor-pointer border-none bg-transparent p-1.5 text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" />
              <circle cx="8" cy="8" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-[#e6b8b1] bg-[#fbeae6] px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-govdoc-deep)]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="group relative mt-2 flex cursor-pointer items-center justify-center gap-3 overflow-hidden border-none bg-[var(--color-govdoc-primary)] px-6 py-[18px] text-[16px] font-medium tracking-[0.005em] text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(138,56,32,0.4),0_8px_20px_rgba(176,74,47,0.22)] transition-all hover:-translate-y-px hover:bg-[var(--color-govdoc-deep)] hover:shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_2px_4px_rgba(138,56,32,0.4),0_14px_28px_rgba(176,74,47,0.3)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_40%)]"
        />
        <span>{busy ? "Signing in…" : "Sign in with SSO"}</span>
        <span className="inline-flex transition-transform group-hover:translate-x-1">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="square"
          >
            <path d="M3 9h12M10 4l5 5-5 5" />
          </svg>
        </span>
      </button>
    </form>
  );
}
