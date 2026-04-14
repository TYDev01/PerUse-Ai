import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 glass border-r border-white/5 flex-col pt-24 px-4 pb-8 gap-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Admin</p>
        <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm">
          Dashboard
        </Link>
        <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm">
          Analytics
        </Link>
        <Link href="/admin/tools" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm">
          All Tools
        </Link>
        <Link href="/admin/runs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm">
          All Runs
        </Link>
        <div className="mt-auto">
          <Link href="/browse" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm">
            View Marketplace
          </Link>
        </div>
      </aside>

      {/* Mobile nav strip — sits below the fixed top navbar */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 border-b border-white/5 bg-[#0c1117]/95 backdrop-blur-sm">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-2">
            Admin
          </span>
          <Link href="/admin/dashboard" className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap shrink-0">
            Dashboard
          </Link>
          <Link href="/admin/analytics" className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap shrink-0">
            Analytics
          </Link>
          <Link href="/admin/tools" className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap shrink-0">
            All Tools
          </Link>
          <Link href="/admin/runs" className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap shrink-0">
            All Runs
          </Link>
          <Link href="/browse" className="ml-auto px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap shrink-0">
            Marketplace
          </Link>
        </div>
      </div>

      <main className="flex-1 pt-32 md:pt-24 px-4 md:px-8 pb-12">{children}</main>
    </div>
  );
}
