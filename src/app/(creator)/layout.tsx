import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/creator/dashboard");
  }

  if (session.user.role !== "CREATOR" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-white/6 flex-col pt-20 pb-8" style={{ background: "rgba(12,17,23,0.95)" }}>
        <div className="px-6 mb-8">
          <p className="text-[10px] font-bold text-[#8b9ab0] uppercase tracking-[0.18em]">Creator</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          <Link
            href="/creator/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8b9ab0] hover:text-white hover:bg-white/5 transition-all font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/creator/analytics"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8b9ab0] hover:text-white hover:bg-white/5 transition-all font-medium"
          >
            Analytics
          </Link>
          <Link
            href="/creator/tools/new"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8b9ab0] hover:text-white hover:bg-white/5 transition-all font-medium"
          >
            New Tool
          </Link>
        </nav>

        <div className="px-3 mt-auto border-t border-white/6 pt-6">
          <Link
            href="/browse"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[#8b9ab0] hover:text-white hover:bg-white/5 transition-all"
          >
            ← Marketplace
          </Link>
        </div>
      </aside>

      {/* Mobile nav strip — sits below the fixed top navbar */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 border-b border-white/6 bg-[#0c1117]/95 backdrop-blur-sm">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <span className="text-[10px] font-bold text-[#8b9ab0] uppercase tracking-[0.18em] shrink-0 mr-2">
            Creator
          </span>
          <Link
            href="/creator/dashboard"
            className="px-3 py-1.5 rounded-lg text-xs text-[#8b9ab0] hover:text-white hover:bg-white/5 transition-all font-medium whitespace-nowrap shrink-0"
          >
            Dashboard
          </Link>
          <Link
            href="/creator/analytics"
            className="px-3 py-1.5 rounded-lg text-xs text-[#8b9ab0] hover:text-white hover:bg-white/5 transition-all font-medium whitespace-nowrap shrink-0"
          >
            Analytics
          </Link>
          <Link
            href="/creator/tools/new"
            className="px-3 py-1.5 rounded-lg text-xs text-[#8b9ab0] hover:text-white hover:bg-white/5 transition-all font-medium whitespace-nowrap shrink-0"
          >
            New Tool
          </Link>
          <Link
            href="/browse"
            className="ml-auto px-3 py-1.5 rounded-lg text-xs text-[#8b9ab0] hover:text-white hover:bg-white/5 transition-all whitespace-nowrap shrink-0"
          >
            ← Marketplace
          </Link>
        </div>
      </div>

      <main className="flex-1 pt-28 md:pt-20 px-4 md:px-10 pb-16">{children}</main>
    </div>
  );
}
