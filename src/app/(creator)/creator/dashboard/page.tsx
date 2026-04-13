import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getCreatorData(userId: string) {
  const [tools, runs, balance] = await Promise.all([
    db.tool.findMany({
      where: { creatorId: userId },
      include: {
        _count: { select: { toolRuns: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.toolRun.findMany({
      where: { tool: { creatorId: userId } },
      select: { status: true, creatorEarning: true },
    }),
    db.creatorBalance.findUnique({ where: { creatorId: userId } }),
  ]);

  const completedRuns = runs.filter((r) => r.status === "COMPLETED");
  return {
    tools,
    totalRuns: runs.length,
    totalRevenue: completedRuns.reduce((s, r) => s + (r.creatorEarning ?? 0), 0),
    pendingBalance: balance?.pendingAmount ?? 0,
  };
}

const STATUS: Record<string, { label: string; color: string }> = {
  DRAFT:          { label: "Draft",          color: "text-[#8b9ab0] bg-white/6 border-white/10" },
  PENDING_REVIEW: { label: "Pending Review", color: "text-yellow-400 bg-yellow-400/8 border-yellow-400/20" },
  APPROVED:       { label: "Approved",       color: "text-[#00C896] bg-[#00C896]/8 border-[#00C896]/25" },
  REJECTED:       { label: "Rejected",       color: "text-red-400 bg-red-400/8 border-red-400/20" },
};

export default async function CreatorDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { tools, totalRuns, totalRevenue, pendingBalance } = await getCreatorData(session.user.id);

  const STATS = [
    { label: "Total Tools",     value: tools.length },
    { label: "Total Runs",      value: totalRuns },
    { label: "Revenue Earned",  value: `$${totalRevenue.toFixed(2)}` },
    { label: "Pending Balance", value: `$${pendingBalance.toFixed(2)}` },
  ];

  return (
    <div className="max-w-5xl">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8 md:mb-10">
        <div>
          <p className="text-[#00C896] text-xs font-bold uppercase tracking-[0.18em] mb-2">Creator</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-[#8b9ab0] mt-1 text-sm">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}
          </p>
        </div>
        <Link
          href="/creator/tools/new"
          className="px-5 py-2.5 bg-[#00C896] hover:bg-[#00b585] text-[#0c1117] rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#00C896]/20 hover:shadow-[#00C896]/35 active:scale-[0.98]"
        >
          + New Tool
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/6 p-6 flex flex-col gap-3"
            style={{ background: "rgba(255,255,255,0.025)" }}
          >
            <p className="text-[#8b9ab0] text-xs font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tools */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-white">Your Tools</h2>
        <span className="text-xs text-[#8b9ab0]">{tools?.length ?? 0} total</span>
      </div>

      {!tools || tools.length === 0 ? (
        <div
          className="rounded-2xl border border-white/6 p-16 text-center"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <p className="text-white font-semibold text-lg mb-2">No tools yet</p>
          <p className="text-[#8b9ab0] text-sm mb-8">Create your first AI tool and start earning.</p>
          <Link
            href="/creator/tools/new"
            className="inline-block px-6 py-2.5 bg-[#00C896] hover:bg-[#00b585] text-[#0c1117] rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#00C896]/20"
          >
            Create your first tool
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/6 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          {/* Desktop table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-white/6">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9ab0]">Tool</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9ab0] text-right">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9ab0] text-right">Runs</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9ab0] text-right">Price</span>
          </div>

          {tools.map((tool, i) => {
            const st = STATUS[tool.status] ?? STATUS.DRAFT;
            return (
              <div
                key={tool.id}
                className={i < tools.length - 1 ? "border-b border-white/5" : ""}
              >
                {/* Mobile card */}
                <div className="sm:hidden px-4 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate">{tool.name}</p>
                      <p className="text-[#8b9ab0] text-xs mt-0.5 truncate">{tool.shortDescription}</p>
                    </div>
                    <span className="text-white text-sm font-semibold shrink-0 tabular-nums">${tool.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold ${st.color}`}>{st.label}</span>
                    <span className="text-[#8b9ab0] text-xs">{tool._count?.toolRuns ?? 0} runs</span>
                  </div>
                </div>

                {/* Desktop table row */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{tool.name}</p>
                    <p className="text-[#8b9ab0] text-xs mt-0.5 truncate">{tool.shortDescription}</p>
                  </div>
                  <span className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold ${st.color}`}>
                    {st.label}
                  </span>
                  <span className="text-[#8b9ab0] text-sm text-right tabular-nums">
                    {tool._count?.toolRuns ?? 0}
                  </span>
                  <span className="text-white text-sm font-semibold text-right tabular-nums">
                    ${tool.price.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
