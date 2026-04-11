import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getStats() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/admin/stats`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getPendingTools() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/admin/tools?status=PENDING_REVIEW&limit=5`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tools ?? [];
}

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const [stats, pendingTools] = await Promise.all([getStats(), getPendingTools()]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
      <p className="text-slate-400 mb-8">Platform overview</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Users", value: stats?.totalUsers ?? 0, icon: "👥" },
          { label: "Total Tools", value: stats?.totalTools ?? 0, icon: "🛠️" },
          { label: "GMV", value: `$${(stats?.gmv ?? 0).toFixed(2)}`, icon: "💵" },
          { label: "Platform Revenue", value: `$${(stats?.platformRevenue ?? 0).toFixed(2)}`, icon: "💰" },
          { label: "Total Runs", value: stats?.totalRuns ?? 0, icon: "▶️" },
          { label: "Failed Runs", value: stats?.failedRuns ?? 0, icon: "❌" },
          { label: "Pending Review", value: stats?.pendingToolsCount ?? 0, icon: "⏳" },
          { label: "Active Creators", value: stats?.activeCreators ?? 0, icon: "✨" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-sm text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending tools */}
      {pendingTools.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Pending Review</h2>
            <Link href="/admin/tools?status=PENDING_REVIEW" className="text-sm text-[#00C896] hover:text-[#00C896]">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingTools.map((tool: any) => (
              <div key={tool.id} className="glass-card rounded-2xl p-5 flex items-center gap-5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white">{tool.name}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    by {tool.creator?.name ?? "Unknown"} · {tool.category}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-white font-semibold">${tool.salePrice?.toFixed(2)}</div>
                  <Link
                    href={`/admin/tools/${tool.id}`}
                    className="px-3 py-1.5 bg-[#00C896] hover:bg-[#00b585] text-white text-xs rounded-lg font-medium transition-all"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingTools.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center text-slate-400">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-white font-medium">No tools pending review</p>
        </div>
      )}
    </div>
  );
}
