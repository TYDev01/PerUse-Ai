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
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/6 flex flex-col pt-20 pb-8" style={{ background: "rgba(12,17,23,0.95)" }}>
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

      <main className="flex-1 pt-20 px-10 pb-16">{children}</main>
    </div>
  );
}
