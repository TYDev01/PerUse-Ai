import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getAnalytics(userId: string) {
  const [tools, runs, balance] = await Promise.all([
    db.tool.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        price: true,
        createdAt: true,
        _count: { select: { toolRuns: true } },
        toolRuns: {
          select: { status: true, creatorEarning: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.toolRun.findMany({
      where: { tool: { creatorId: userId } },
      select: { status: true, creatorEarning: true, createdAt: true, toolId: true },
      orderBy: { createdAt: "asc" },
    }),
    db.creatorBalance.findUnique({ where: { creatorId: userId } }),
  ]);

  // ── Top-level numbers ──────────────────────────────────────────────────────
  const completedRuns = runs.filter((r) => r.status === "COMPLETED");
  const totalRevenue = completedRuns.reduce((s, r) => s + (r.creatorEarning ?? 0), 0);

  // ── Status breakdown ───────────────────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  for (const r of runs) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  }

  // ── Per-tool performance (sorted by revenue desc) ──────────────────────────
  const toolPerformance = tools
    .map((tool) => {
      const completed = tool.toolRuns.filter((r) => r.status === "COMPLETED");
      return {
        id: tool.id,
        name: tool.name,
        slug: tool.slug,
        status: tool.status,
        price: tool.price,
        totalRuns: tool._count.toolRuns,
        completedRuns: completed.length,
        revenue: completed.reduce((s, r) => s + (r.creatorEarning ?? 0), 0),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // ── Monthly stats (last 6 months) ─────────────────────────────────────────
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
    };
  });

  const monthlyStats = months.map(({ year, month, label }) => {
    const monthRuns = runs.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      label,
      runs: monthRuns.length,
      revenue: monthRuns
        .filter((r) => r.status === "COMPLETED")
        .reduce((s, r) => s + (r.creatorEarning ?? 0), 0),
    };
  });

  return {
    totalTools: tools.length,
    totalRuns: runs.length,
    totalRevenue,
    pendingBalance: balance?.pendingAmount ?? 0,
    availableBalance: balance?.availableAmount ?? 0,
    statusCounts,
    toolPerformance,
    monthlyStats,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOOL_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT:          { label: "Draft",          color: "text-[#8b9ab0] bg-white/6 border-white/10" },
  PENDING_REVIEW: { label: "Pending Review", color: "text-yellow-400 bg-yellow-400/8 border-yellow-400/20" },
  APPROVED:       { label: "Approved",       color: "text-[#00C896] bg-[#00C896]/8 border-[#00C896]/25" },
  REJECTED:       { label: "Rejected",       color: "text-red-400 bg-red-400/8 border-red-400/20" },
};

const RUN_STATUS: Record<string, { label: string; color: string; bar: string }> = {
  COMPLETED:       { label: "Completed",       color: "text-[#00C896]", bar: "bg-[#00C896]" },
  FAILED:          { label: "Failed",          color: "text-red-400",   bar: "bg-red-400" },
  PENDING_PAYMENT: { label: "Pending Payment", color: "text-yellow-400",bar: "bg-yellow-400" },
  PAID:            { label: "Paid",            color: "text-blue-400",  bar: "bg-blue-400" },
  EXECUTING:       { label: "Executing",       color: "text-purple-400",bar: "bg-purple-400" },
  REFUNDED:        { label: "Refunded",        color: "text-orange-400",bar: "bg-orange-400" },
};

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CreatorAnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const {
    totalTools,
    totalRuns,
    totalRevenue,
    pendingBalance,
    availableBalance,
    statusCounts,
    toolPerformance,
    monthlyStats,
  } = await getAnalytics(session.user.id);

  const maxMonthlyRuns = Math.max(...monthlyStats.map((m) => m.runs), 1);
  const maxMonthlyRevenue = Math.max(...monthlyStats.map((m) => m.revenue), 1);

  const STATS = [
    { label: "Tools Created",    value: totalTools,                       sub: null },
    { label: "Total Runs",       value: totalRuns,                        sub: null },
    { label: "Revenue Earned",   value: `$${totalRevenue.toFixed(2)}`,   sub: null },
    { label: "Pending Balance",  value: `$${pendingBalance.toFixed(2)}`, sub: `$${availableBalance.toFixed(2)} available` },
  ] as const;

  return (
    <div className="max-w-5xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8 md:mb-10">
        <p className="text-[#00C896] text-xs font-bold uppercase tracking-[0.18em] mb-2">Creator</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-[#8b9ab0] mt-1 text-sm">Performance overview for your tools</p>
      </div>

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/6 p-4 sm:p-5 flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.025)" }}
          >
            <p className="text-[#8b9ab0] text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider">{s.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">{s.value}</p>
            {s.sub && <p className="text-[11px] text-[#8b9ab0]">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Two-column: Run status + Monthly activity ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Run Status Breakdown */}
        <div
          className="rounded-2xl border border-white/6 p-5 sm:p-6"
          style={{ background: "rgba(255,255,255,0.025)" }}
        >
          <h2 className="text-sm font-semibold text-white mb-5">Run Status Breakdown</h2>

          {totalRuns === 0 ? (
            <p className="text-[#8b9ab0] text-sm">No runs yet.</p>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(RUN_STATUS).map(([key, meta]) => {
                const count = statusCounts[key] ?? 0;
                const percent = pct(count, totalRuns);
                if (count === 0) return null;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                      <span className="text-xs text-[#8b9ab0] tabular-nums">
                        {count} <span className="text-white/30">({percent}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${meta.bar}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Activity */}
        <div
          className="rounded-2xl border border-white/6 p-5 sm:p-6"
          style={{ background: "rgba(255,255,255,0.025)" }}
        >
          <h2 className="text-sm font-semibold text-white mb-1">Monthly Activity</h2>
          <p className="text-[11px] text-[#8b9ab0] mb-5">Last 6 months</p>

          {/* Bar chart — runs */}
          <p className="text-[10px] font-bold text-[#8b9ab0] uppercase tracking-wider mb-3">Runs</p>
          <div className="flex items-end gap-2 h-20 mb-1">
            {monthlyStats.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                  <div
                    className="w-full rounded-t-md bg-[#00C896]/50 hover:bg-[#00C896]/70 transition-colors"
                    style={{ height: `${pct(m.runs, maxMonthlyRuns)}%`, minHeight: m.runs ? "4px" : "0" }}
                    title={`${m.runs} runs`}
                  />
                </div>
                <span className="text-[10px] text-[#8b9ab0] tabular-nums">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Bar chart — revenue */}
          <p className="text-[10px] font-bold text-[#8b9ab0] uppercase tracking-wider mt-5 mb-3">Revenue</p>
          <div className="flex items-end gap-2 h-20">
            {monthlyStats.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                  <div
                    className="w-full rounded-t-md bg-[#00C896]/80 hover:bg-[#00C896] transition-colors"
                    style={{ height: `${pct(m.revenue, maxMonthlyRevenue)}%`, minHeight: m.revenue ? "4px" : "0" }}
                    title={`$${m.revenue.toFixed(2)}`}
                  />
                </div>
                <span className="text-[10px] text-[#8b9ab0] tabular-nums">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tool Performance Table ──────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-white/6 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.025)" }}
      >
        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Tool Performance</h2>
          <span className="text-xs text-[#8b9ab0]">{totalTools} tool{totalTools !== 1 ? "s" : ""}</span>
        </div>

        {toolPerformance.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-white font-semibold text-sm mb-1">No tools yet</p>
            <p className="text-[#8b9ab0] text-xs">Create your first tool to see performance data.</p>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-white/6">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9ab0]">Tool</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9ab0] text-right">Status</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9ab0] text-right">Total Runs</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9ab0] text-right">Completed</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9ab0] text-right">Earned</span>
            </div>

            {toolPerformance.map((tool, i) => {
              const st = TOOL_STATUS[tool.status] ?? TOOL_STATUS.DRAFT;
              const conversionRate = tool.totalRuns > 0
                ? Math.round((tool.completedRuns / tool.totalRuns) * 100)
                : 0;

              return (
                <div
                  key={tool.id}
                  className={i < toolPerformance.length - 1 ? "border-b border-white/5" : ""}
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden px-4 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm truncate">{tool.name}</p>
                        <p className="text-[#8b9ab0] text-xs mt-0.5">{tool.price.toFixed(2)} USDC/run</p>
                      </div>
                      <p className="text-[#00C896] font-bold text-sm tabular-nums shrink-0">
                        ${tool.revenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="text-[#8b9ab0] text-xs">{tool.totalRuns} runs</span>
                      <span className="text-[#8b9ab0] text-xs">{conversionRate}% complete</span>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{tool.name}</p>
                      <p className="text-[#8b9ab0] text-xs mt-0.5">{tool.price.toFixed(2)} USDC / run</p>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold ${st.color}`}>
                      {st.label}
                    </span>
                    <span className="text-[#8b9ab0] text-sm text-right tabular-nums">
                      {tool.totalRuns}
                    </span>
                    <span className="text-[#8b9ab0] text-sm text-right tabular-nums">
                      {tool.completedRuns}
                      <span className="text-[#8b9ab0]/50 text-xs ml-1">({conversionRate}%)</span>
                    </span>
                    <span className="text-[#00C896] text-sm font-semibold text-right tabular-nums">
                      ${tool.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
