import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const RUN_STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "bg-slate-500/20 text-slate-400",
  PAID: "bg-blue-500/20 text-blue-400",
  EXECUTING: "bg-yellow-500/20 text-yellow-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  FAILED: "bg-red-500/20 text-red-400",
  REFUNDED: "bg-orange-500/20 text-orange-400",
};

async function getRuns(status?: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const url = status
    ? `${base}/api/admin/runs?status=${status}`
    : `${base}/api/admin/runs`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.runs ?? [];
}

export default async function AdminRunsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const status = searchParams.status;
  const runs = await getRuns(status);
  const statuses = ["", "PENDING_PAYMENT", "COMPLETED", "FAILED", "EXECUTING"];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">All Runs</h1>
      <p className="text-slate-400 mb-6">Monitor tool executions</p>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/admin/runs?status=${s}` : "/admin/runs"}
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

      {runs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400">No runs found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="pb-3 pr-4 font-medium">Run</th>
                <th className="pb-3 pr-4 font-medium">Tool</th>
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Provider</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {runs.map((run: any) => (
                <tr key={run.id} className="group">
                  <td className="py-3 pr-4">
                    <code className="text-xs text-slate-500">{run.id.slice(0, 8)}…</code>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-white font-medium">{run.tool?.name ?? "?"}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {run.user?.email ?? "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RUN_STATUS_COLORS[run.status] ?? ""}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-white">
                    ${run.amountPaidUsd?.toFixed(2) ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">
                    {run.providerUsed ?? "—"}
                  </td>
                  <td className="py-3 text-slate-500 text-xs">
                    {new Date(run.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
