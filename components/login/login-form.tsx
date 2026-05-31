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
    router.push("/workspace" as never);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="relative">
        <div className="mb-2.5 flex items-baseline justify-between">
          <label
            htmlFor="username"
            className="uppercase text-[#0E1410]"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600, letterSpacing: "3px" }}
          >
            Work Email
          </label>
          <span className="uppercase text-[#3D5740]" style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "2px" }}>
            ✓ Verified
          </span>
        </div>
        <div className="relative border border-[#D4CDB8] bg-[#F7F2E6] transition-all hover:border-[#8B877D] focus-within:border-[#0E1410] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(14,20,16,0.06)]">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6E706A]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3.5" width="12" height="9" rx="1" />
              <path d="m2.5 4.5 5.5 4 5.5-4" />
            </svg>
          </span>
          <input
            id="username"
            name="username"
            type="text"
            inputMode="email"
            placeholder="Jothi@LLMatScale.AI"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-none bg-transparent px-4 py-4 pl-[46px] text-[15px] text-[#0E1410] outline-none placeholder:text-[#8B877D]"
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "-0.2px" }}
          />
        </div>
      </div>

      <div className="relative">
        <div className="mb-2.5 flex items-baseline justify-between">
          <label
            htmlFor="password"
            className="uppercase text-[#0E1410]"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", fontWeight: 600, letterSpacing: "3px" }}
          >
            Password
          </label>
          <a
            href="#"
            className="uppercase text-[#6E706A] no-underline hover:text-[#0E1410]"
            style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", fontWeight: 600, letterSpacing: "2px" }}
          >
            Reset →
          </a>
        </div>
        <div className="relative border border-[#D4CDB8] bg-[#F7F2E6] transition-all hover:border-[#8B877D] focus-within:border-[#0E1410] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(14,20,16,0.06)]">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6E706A]">
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
            className="w-full border-none bg-transparent px-4 py-4 pl-[46px] pr-12 text-[15px] text-[#0E1410] outline-none placeholder:text-[#8B877D]"
            style={{ fontFamily: "var(--font-sans)", letterSpacing: "-0.2px" }}
          />
          <button
            type="button"
            aria-label={showPw ? "Hide" : "Show"}
            aria-controls="password"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3.5 top-1/2 flex -translate-y-1/2 cursor-pointer border-none bg-transparent p-1.5 text-[#6E706A] transition-colors hover:text-[#0E1410]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8z" />
              <circle cx="8" cy="8" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="border border-[#F1E1DC] bg-[#F1E1DC]/50 px-3 py-2.5 uppercase text-[#8E3535]"
          style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "2px" }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="group relative mt-2 flex cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-[4px] border-none bg-[#3D5740] px-6 py-[18px] text-[16px] font-medium text-[#FCFAF3] shadow-[0_1px_0_rgba(255,255,255,0.10)_inset,0_1px_2px_rgba(14,20,16,0.4),0_8px_20px_rgba(14,20,16,0.15)] transition-all hover:-translate-y-px hover:bg-[#0E1410] hover:shadow-[0_1px_0_rgba(255,255,255,0.10)_inset,0_2px_4px_rgba(14,20,16,0.4),0_14px_28px_rgba(14,20,16,0.2)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.3px" }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_40%)]"
        />
        <span>{busy ? "Signing in…" : "Sign In"}</span>
        <span className="inline-flex transition-transform group-hover:translate-x-1">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
            <path d="M3 9h12M10 4l5 5-5 5" />
          </svg>
        </span>
      </button>

      <div className="mt-8 flex items-start gap-4 rounded-[4px] border border-[#D4CDB8] bg-[#F7F2E6] px-5 py-4">
        <span className="mt-0.5 flex-shrink-0 text-[#3D5740]">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 9.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="flex-1 text-[12px] leading-[1.5] text-[#0E1410]" style={{ fontFamily: "var(--font-sans)" }}>
          <span>
            Every decision is <em className="italic">cited, reasoned, and auditable</em>.
          </span>
          <br />
          <span className="text-[#6E706A]">Built on Anthropic Claude — no black box.</span>
        </div>
        <a
          href="#"
          className="flex-shrink-0 self-center uppercase text-[#6E706A] hover:text-[#0E1410]"
          style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", letterSpacing: "2px" }}
        >
          Learn More →
        </a>
      </div>
    </form>
  );
}
