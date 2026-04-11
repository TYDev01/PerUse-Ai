"use client";

import Link from "next/link";
import { useState, useEffect, useRef, ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";

type Tool = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: number;
  category: string;
  totalRuns: number;
  coverImageUrl: string | null;
  creator: { name: string | null };
};

type Stats = { toolCount: number; runCount: number };

// ── Scroll-reveal wrapper ─────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Landing Navbar ────────────────────────────────────────────────────────────
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  }

  const navLinks = [
    { label: "Features", id: "features" },
    { label: "How it Works", id: "how-it-works" },
    { label: "Docs", id: "docs" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0c1117]/96 backdrop-blur-xl border-b border-white/6 shadow-2xl"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#00C896] flex items-center justify-center shadow-lg shadow-[#00C896]/30 group-hover:shadow-[#00C896]/50 transition-shadow">
              <span className="text-[#0c1117] font-black text-sm leading-none">P</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              PerUseAI
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse mt-0.5" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm text-[#8b9ab0] hover:text-white transition-colors cursor-pointer font-medium"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {ready && authenticated ? (
              <>
                <Link
                  href="/browse"
                  className="text-sm text-[#8b9ab0] hover:text-white transition-colors font-medium"
                >
                  My Tools
                </Link>
                <Link
                  href="/browse"
                  className="text-sm px-4 py-2.5 rounded-lg bg-[#00C896] text-[#0c1117] font-bold hover:bg-[#00b585] transition-all shadow-lg shadow-[#00C896]/20"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-[#8b9ab0] hover:text-white transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-sm px-4 py-2.5 rounded-lg bg-[#00C896] text-[#0c1117] font-bold hover:bg-[#00b585] transition-all shadow-lg shadow-[#00C896]/20 hover:shadow-[#00C896]/40"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-[#8b9ab0] hover:text-white transition-colors cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/8 py-4 space-y-1 bg-[#0c1117]/98">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="block w-full text-left px-2 py-3 text-sm text-[#8b9ab0] hover:text-white transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/login" className="text-sm text-[#8b9ab0] hover:text-white py-2">Sign In</Link>
              <Link href="/register" className="text-sm px-4 py-3 rounded-lg bg-[#00C896] text-[#0c1117] font-bold text-center">
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage({
  featuredTools,
  stats,
}: {
  featuredTools: Tool[];
  stats: Stats;
}) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#0c1117] text-white overflow-x-hidden">
      {/* Global ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#00C896]/5 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[400px] rounded-full bg-[#0040a0]/6 blur-[120px]" />
        <div className="absolute top-[40%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#00C896]/4 blur-[120px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <LandingNavbar />

      {/* ─────────────────────── HERO ─────────────────────── */}
      <section className="relative z-10 pt-40 pb-32 px-6 text-center">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-[#00C896]/30 bg-[#00C896]/8 text-[#00C896] text-sm font-semibold">
          <span className="text-base">⚡</span>
          <span>Built on USDC · Powered by Locus Payments</span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up text-6xl sm:text-8xl font-black leading-[1.03] tracking-tight mb-6 max-w-4xl mx-auto"
          style={{ animationDelay: "60ms" }}
        >
          <span className="text-white">Run AI tools,</span>
          <br />
          <span className="text-white">anywhere. </span>
          <span className="text-[#00C896]">Pay per run.</span>
        </h1>

        {/* Subtext */}
        <p
          className="animate-fade-up text-[#8b9ab0] text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ animationDelay: "120ms" }}
        >
          The AI marketplace that moves results at the speed of inference — with the
          trust of USDC micropayments. No subscriptions, no seat limits, ever.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-up flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ animationDelay: "180ms" }}
        >
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl bg-[#00C896] text-[#0c1117] font-bold text-base hover:bg-[#00b585] transition-all shadow-2xl shadow-[#00C896]/25 hover:shadow-[#00C896]/45 hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
          <button
            onClick={() => scrollTo("how-it-works")}
            className="px-8 py-4 rounded-xl border border-white/12 text-white font-semibold text-base hover:border-white/25 hover:bg-white/4 transition-all cursor-pointer"
          >
            See how it works →
          </button>
        </div>

        {/* Stats strip */}
        <div
          className="animate-fade-up flex flex-wrap items-center justify-center gap-x-12 gap-y-6 mt-24"
          style={{ animationDelay: "240ms" }}
        >
          {[
            { value: stats.toolCount > 0 ? `${stats.toolCount}+` : "100+", label: "AI Tools" },
            { value: stats.runCount > 0 ? stats.runCount.toLocaleString() : "10k+", label: "Runs Completed" },
            { value: "USDC", label: "Payment Rail" },
            { value: "< 1s", label: "Avg. Result Time" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-white">{s.value}</div>
              <div className="text-sm text-[#8b9ab0] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={() => scrollTo("features")}
            className="cursor-pointer text-[#8b9ab0]/50 hover:text-[#8b9ab0] transition-colors animate-bounce"
            aria-label="Scroll down"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ─────────────────────── FEATURES ─────────────────────── */}
      <section id="features" className="relative z-10 py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-[#00C896] text-xs font-bold uppercase tracking-[0.2em] mb-4">
              Features
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Everything you need to run AI at scale
            </h2>
            <p className="text-[#8b9ab0] mt-4 max-w-xl mx-auto text-base leading-relaxed">
              No subscriptions. No seat limits. Pure pay-per-use access to the best AI tools built by independent creators.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: "⚡",
                title: "Instant Results",
                desc: "Every tool runs within seconds. Submit your input, get your output — no queues, no waiting.",
              },
              {
                icon: "💳",
                title: "Pay Per Run",
                desc: "Micropayments in USDC via Locus. You only pay for what you actually use — down to the cent.",
              },
              {
                icon: "🛠️",
                title: "Creator Marketplace",
                desc: "Publish your own AI tools and earn 80% of every run. Full control over pricing and access.",
              },
              {
                icon: "🔒",
                title: "Secure by Design",
                desc: "Every run is isolated. Your inputs never leave the execution sandbox. Payments are non-custodial.",
              },
              {
                icon: "📊",
                title: "Full Run History",
                desc: "Every execution is logged. Review outputs, re-run with one click, export your data anytime.",
              },
              {
                icon: "🌍",
                title: "Global Access",
                desc: "Tools run anywhere, payments settle anywhere. Crypto-native from day one.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="h-full p-6 rounded-2xl border border-white/6 bg-white/[0.025] hover:border-[#00C896]/35 hover:bg-[#00C896]/4 transition-all duration-300 group">
                  <div className="w-11 h-11 rounded-xl bg-[#00C896]/10 flex items-center justify-center text-xl mb-5 group-hover:bg-[#00C896]/18 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-white text-[15px] mb-2">{f.title}</h3>
                  <p className="text-[#8b9ab0] text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── HOW IT WORKS ─────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-28 px-6" style={{ background: "rgba(255,255,255,0.012)" }}>
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-[#00C896] text-xs font-bold uppercase tracking-[0.2em] mb-4">
              How it Works
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
              From query to result in three steps
            </h2>
          </Reveal>

          <div className="space-y-5">
            {[
              {
                num: "01",
                title: "Browse & Pick a Tool",
                desc: "Search the marketplace for the AI capability you need. Filter by category, price, or creator rating. Every tool shows you the exact per-run cost upfront — no hidden fees.",
                cta: "Browse tools →",
                href: "/browse",
              },
              {
                num: "02",
                title: "Submit & Pay Per Run",
                desc: "Fill in your inputs and pay with USDC via Locus — the fastest crypto payment rail on the market. No wallet setup required if you use email login.",
                cta: "See payment flow →",
                href: "/register",
              },
              {
                num: "03",
                title: "Receive Instant Results",
                desc: "Your AI result is ready in seconds. Download, copy, or re-run with different inputs. Full history lives in your dashboard — forever.",
                cta: "Get started free →",
                href: "/register",
              },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 100}>
                <div className="flex items-start gap-6 sm:gap-8 p-6 sm:p-8 rounded-2xl border border-white/6 bg-white/[0.025] hover:border-[#00C896]/20 transition-all group">
                  <div className="text-5xl sm:text-6xl font-black text-[#00C896]/15 group-hover:text-[#00C896]/25 transition-colors leading-none shrink-0 select-none w-14 sm:w-16">
                    {step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg sm:text-xl mb-2">{step.title}</h3>
                    <p className="text-[#8b9ab0] leading-relaxed text-sm sm:text-base">{step.desc}</p>
                  </div>
                  <Link
                    href={step.href}
                    className="shrink-0 hidden sm:block self-center text-sm text-[#00C896] font-semibold hover:underline whitespace-nowrap"
                  >
                    {step.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── MARKETPLACE ─────────────────────── */}
      {featuredTools.length > 0 && (
        <section className="relative z-10 py-28 px-6">
          <div className="max-w-7xl mx-auto">
            <Reveal className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[#00C896] text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  Marketplace
                </p>
                <h2 className="text-4xl font-black text-white">Popular right now</h2>
              </div>
              <Link href="/browse" className="text-sm text-[#00C896] font-semibold hover:underline shrink-0">
                View all →
              </Link>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredTools.map((tool, i) => (
                <Reveal key={tool.id} delay={i * 100}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="block h-full p-6 rounded-2xl border border-white/6 bg-white/[0.025] hover:border-[#00C896]/30 hover:bg-[#00C896]/3 transition-all duration-300 group"
                  >
                    {tool.coverImageUrl && (
                      <div className="w-full h-36 rounded-xl overflow-hidden mb-5 bg-white/5">
                        <img
                          src={tool.coverImageUrl}
                          alt={tool.name}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white/6 border border-white/8 text-[#8b9ab0]">
                        {tool.category}
                      </span>
                      <span className="text-[#00C896] font-bold text-sm">${tool.price.toFixed(2)}</span>
                    </div>
                    <h3 className="font-bold text-white text-base mb-1.5 group-hover:text-[#00C896] transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-[#8b9ab0] text-sm line-clamp-2">{tool.shortDescription}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/6">
                      <span className="text-xs text-[#8b9ab0]">by {tool.creator.name ?? "Creator"}</span>
                      <span className="text-xs text-[#8b9ab0]">{tool.totalRuns} runs</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────── DOCS / CTA ─────────────────────── */}
      <section id="docs" className="relative z-10 py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="relative rounded-3xl border border-[#00C896]/20 overflow-hidden p-12 sm:p-16 text-center">
              {/* Card glow */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#00C896]/10 via-transparent to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-[#00C896]/10 blur-[90px]" />

              <div className="relative">
                <p className="text-[#00C896] text-xs font-bold uppercase tracking-[0.2em] mb-4">
                  Get Started
                </p>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
                  Ready to run your first<br />AI tool?
                </h2>
                <p className="text-[#8b9ab0] text-base mb-10 max-w-lg mx-auto leading-relaxed">
                  Create your free account in under 30 seconds. No credit card required.
                  Pay only when you actually run a tool.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="px-8 py-4 rounded-xl bg-[#00C896] text-[#0c1117] font-bold text-base hover:bg-[#00b585] transition-all shadow-2xl shadow-[#00C896]/30 hover:-translate-y-0.5"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    href="/browse"
                    className="px-8 py-4 rounded-xl border border-white/12 text-white font-semibold text-base hover:border-white/25 hover:bg-white/4 transition-all"
                  >
                    Browse Tools
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────── FOOTER ─────────────────────── */}
      <footer className="relative z-10 border-t border-white/6 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[#00C896] flex items-center justify-center">
              <span className="text-[#0c1117] font-black text-xs leading-none">P</span>
            </div>
            <span className="text-sm text-[#8b9ab0]">
              PerUseAI · Pay per use, powered by Locus
            </span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Browse", href: "/browse" },
              { label: "Sign In", href: "/login" },
              { label: "Register", href: "/register" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-[#8b9ab0] hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
