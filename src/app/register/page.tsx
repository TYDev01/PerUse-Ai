"use client";

import { Suspense, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const [role, setRole] = useState<"USER" | "CREATOR">("USER");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated || syncing) return;
    setSyncing(true);
    fetch("/api/auth/privy-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    }).then((r) => {
      if (r.ok) {
        router.push(role === "CREATOR" ? "/creator/dashboard" : "/browse");
      }
    });
  }, [ready, authenticated, role, syncing, router]);

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background gradient blob */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#00C896]/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-[#00C896]/15 blur-[100px]" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C896] to-[#009e78] flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-base">P</span>
          </div>
          <span className="font-bold text-xl text-white tracking-tight">
            PerUse<span className="text-[#00C896]">AI</span>
          </span>
        </Link>

        {/* Hero copy */}
        <div className="relative space-y-10">
          <div>
            <p className="text-[#00C896] text-sm font-semibold uppercase tracking-widest mb-4">
              The AI marketplace
            </p>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Run powerful AI tools.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Pay only for what you use.
              </span>
            </h2>
            <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-sm">
              Access hundreds of AI tools from independent creators — no subscriptions, no lock-in. One credit, one run.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-4">
            {[
              { icon: "⚡", title: "Instant execution", desc: "Tools run in seconds via battle-tested APIs" },
              { icon: "💳", title: "Pay-per-run pricing", desc: "USDC micropayments, no monthly fees" },
              { icon: "🛡️", title: "Creator revenue share", desc: "80% of every run goes straight to creators" },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Stats strip */}
          <div className="flex items-center gap-8 pt-2">
            {[
              { value: "2,400+", label: "AI Tools" },
              { value: "18k", label: "Active users" },
              { value: "$0 / mo", label: "Base cost" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-white font-bold text-xl">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm">
          <p className="text-slate-300 text-sm leading-relaxed">
            &ldquo;I published my first tool in under an hour and made back my API costs in the first week. PerUseAI is genuinely different.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
              MK
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Marcus K.</p>
              <p className="text-slate-500 text-xs">AI Tool Creator</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C896] to-[#009e78] flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-lg text-white">PerUse<span className="text-[#00C896]">AI</span></span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-slate-400 text-sm mt-1.5">
              Already have one?{" "}
              <Link href="/login" className="text-[#00C896] hover:text-[#00C896] transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>

          {/* Role cards */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">I want to…</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("USER")}
                className={`relative rounded-2xl p-4 text-left transition-all border-2 cursor-pointer ${
                  role === "USER"
                    ? "border-[#00C896] bg-[#00C896]/10"
                    : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                {role === "USER" && (
                  <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#00C896] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </span>
                )}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mb-3 text-lg">
                  🎯
                </div>
                <p className={`text-sm font-semibold mb-1 ${role === "USER" ? "text-white" : "text-slate-300"}`}>
                  Use AI tools
                </p>
                <p className="text-xs text-slate-500 leading-snug">Pay per run, no subscription</p>
              </button>

              <button
                type="button"
                onClick={() => setRole("CREATOR")}
                className={`relative rounded-2xl p-4 text-left transition-all border-2 cursor-pointer ${
                  role === "CREATOR"
                    ? "border-[#00C896] bg-[#00C896]/10"
                    : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                {role === "CREATOR" && (
                  <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#00C896] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </span>
                )}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-3 text-lg">
                  🛠️
                </div>
                <p className={`text-sm font-semibold mb-1 ${role === "CREATOR" ? "text-white" : "text-slate-300"}`}>
                  Sell AI tools
                </p>
                <p className="text-xs text-slate-500 leading-snug">Publish tools & earn 80%</p>
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={login}
            disabled={!ready || syncing}
            className="w-full py-3.5 rounded-xl bg-[#00C896] hover:bg-[#00b585] active:scale-[0.98] disabled:opacity-50 text-white font-semibold transition-all text-sm shadow-lg shadow-indigo-500/20"
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Setting up your account…
              </span>
            ) : ready ? (
              "Continue with Privy →"
            ) : (
              "Loading…"
            )}
          </button>

          {/* Supported methods */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-slate-500">Supports</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            {["Email", "Google", "GitHub", "Wallet"].map((m) => (
              <span key={m} className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
                {m}
              </span>
            ))}
          </div>

          <p className="text-center text-xs text-slate-600 mt-6 leading-relaxed">
            By continuing you agree to our{" "}
            <Link href="#" className="text-slate-500 hover:text-slate-400 underline underline-offset-2">Terms</Link>
            {" "}and{" "}
            <Link href="#" className="text-slate-500 hover:text-slate-400 underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}


