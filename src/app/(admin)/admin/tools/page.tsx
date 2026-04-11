import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-500/20 text-slate-400",
  PENDING_REVIEW: "bg-yellow-500/20 text-yellow-400",
  APPROVED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

async function getTools(status?: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const url = status
    ? `${base}/api/admin/tools?status=${status}`
    : `${base}/api/admin/tools`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tools ?? [];
}

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const status = searchParams.status;
  const tools = await getTools(status);
  const statuses = ["", "PENDING_REVIEW", "APPROVED", "REJECTED", "DRAFT"];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">All Tools</h1>
      <p className="text-slate-400 mb-6">Manage marketplace tools</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/admin/tools?status=${s}` : "/admin/tools"}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              (status ?? "") === s
                ? "bg-[#00C896] text-white"
                : "glass text-slate-400 hover:text-white"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      {tools.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400">No tools found</div>
      ) : (
        <div className="space-y-3">
          {tools.map((tool: any) => (
            <div key={tool.id} className="glass-card rounded-2xl p-5 flex items-center gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-white">{tool.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tool.status] ?? ""}`}>
                    {tool.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">
                  by {tool.creator?.name ?? "?"} · {tool.category}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-white font-semibold">${tool.salePrice?.toFixed(2)}</div>
                  <div className="text-slate-500 text-xs">{tool._count?.runs ?? 0} runs</div>
                </div>
                <Link
                  href={`/admin/tools/${tool.id}`}
                  className="px-3 py-1.5 glass hover:bg-white/10 text-slate-300 hover:text-white text-xs rounded-lg font-medium transition-all"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
