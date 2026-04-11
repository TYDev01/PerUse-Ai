"use client";

import { Suspense, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !authenticated) return;
    fetch("/api/auth/privy-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).then(() => router.push("/browse"));
  }, [ready, authenticated, router]);

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#00C896]/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-[#00C896]/15 blur-[100px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <Link href="/" className="relative flex items-center gap-3 w-fit">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C896] to-[#009e78] flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white font-bold text-base">P</span>
          </div>
          <span className="font-bold text-xl text-white tracking-tight">
            PerUse<span className="text-[#00C896]">AI</span>
          </span>
        </Link>

        <div className="relative space-y-10">
          <div>
            <p className="text-[#00C896] text-sm font-semibold uppercase tracking-widest mb-4">
              Welcome back
            </p>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Your AI toolkit<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                is waiting for you.
              </span>
            </h2>
            <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-sm">
              Sign back in to access your tools, view run history, and pick up where you left off.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { icon: "📊", title: "Full run history", desc: "Every execution logged with inputs & outputs" },
              { icon: "🔁", title: "Re-run in one click", desc: "Replay any previous run instantly" },
              { icon: "💼", title: "Creator earnings", desc: "Track revenue across all your published tools" },
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
        </div>

        <div className="relative rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-sm">
          <p className="text-slate-300 text-sm leading-relaxed">
            &ldquo;I use PerUseAI every day. The pay-per-run model means I only spend money on the tasks that actually matter.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              SL
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Sara L.</p>
              <p className="text-slate-500 text-xs">Product Designer</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C896] to-[#009e78] flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-lg text-white">PerUse<span className="text-[#00C896]">AI</span></span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Sign in</h1>
            <p className="text-slate-400 text-sm mt-1.5">
              New here?{" "}
              <Link href="/register" className="text-[#00C896] hover:text-[#00C896] transition-colors font-medium">
                Create an account
              </Link>
            </p>
          </div>

          <button
            onClick={login}
            disabled={!ready}
            className="w-full py-3.5 rounded-xl bg-[#00C896] hover:bg-[#00b585] active:scale-[0.98] disabled:opacity-50 text-white font-semibold transition-all text-sm shadow-lg shadow-indigo-500/20"
          >
            {ready ? "Continue with Privy →" : "Loading…"}
          </button>

          <div className="flex items-center gap-3 mt-6">
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

