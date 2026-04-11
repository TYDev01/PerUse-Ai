"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";

type DbUser = { id: string; email: string; name: string | null; role: string } | null;

export default function Navbar() {
  const { ready, authenticated, user: privyUser, logout } = usePrivy();
  const [dbUser, setDbUser] = useState<DbUser>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) { setDbUser(null); return; }
    fetch("/api/auth/privy-sync", { method: "POST", body: JSON.stringify({}) })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setDbUser(data))
      .catch(() => setDbUser(null));
  }, [ready, authenticated]);

  const role = dbUser?.role;
  const displayName =
    dbUser?.name ??
    privyUser?.google?.name ??
    privyUser?.github?.name ??
    dbUser?.email ??
    "";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0c1117]/96 backdrop-blur-xl border-b border-white/6 shadow-2xl"
          : "bg-[#0c1117]/80 backdrop-blur-md border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#00C896] flex items-center justify-center shadow-lg shadow-[#00C896]/30 group-hover:shadow-[#00C896]/50 transition-shadow">
              <span className="text-[#0c1117] font-black text-sm leading-none">P</span>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              PerUse<span className="text-white">AI</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/browse" className="text-sm text-[#8b9ab0] hover:text-white transition-colors font-medium">
              Browse Tools
            </Link>
            {(role === "CREATOR" || role === "ADMIN") && (
              <Link href="/creator/dashboard" className="text-sm text-[#8b9ab0] hover:text-white transition-colors font-medium">
                Creator Dashboard
              </Link>
            )}
            {role === "ADMIN" && (
              <Link href="/admin/dashboard" className="text-sm text-[#8b9ab0] hover:text-white transition-colors font-medium">
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {authenticated && dbUser ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#00C896]/40 bg-white/3 hover:bg-[#00C896]/6 transition-all text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-[#00C896] flex items-center justify-center text-[#0c1117] text-xs font-black">
                    {displayName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="text-white hidden sm:block max-w-[120px] truncate font-medium">
                    {displayName}
                  </span>
                  <svg className="w-3.5 h-3.5 text-[#8b9ab0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden border border-white/8 bg-[#0f1621] shadow-2xl">
                    <div className="px-4 py-3 text-xs text-[#8b9ab0] border-b border-white/6">
                      {dbUser.email}
                    </div>
                    {(role === "CREATOR" || role === "ADMIN") && (
                      <Link
                        href="/creator/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#8b9ab0] hover:bg-white/4 hover:text-white transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        Creator Dashboard
                      </Link>
                    )}
                    {role === "ADMIN" && (
                      <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#8b9ab0] hover:bg-white/4 hover:text-white transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-white/6">
                      <button
                        onClick={() => { logout(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/4 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[#8b9ab0] hover:text-white transition-colors font-medium">
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
        </div>
      </div>
    </nav>
  );
}


