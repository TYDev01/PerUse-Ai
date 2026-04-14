import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getAdminAnalytics() {
  const now = new Date();

  const [
    totalUsers,
    totalCreators,
    activeCreators,
    toolGroups,
    runs,
    balances,
    topTools,
    topCreators,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "CREATOR" } }),
    db.user.count({ where: { role: "CREATOR", tools: { some: { status: "APPROVED" } } } }),
    db.tool.groupBy({ by: ["status"], _count: true }),
    db.toolRun.findMany({
      select: {
        status: true,
        salePrice: true,
        platformFee: true,
        creatorEarning: true,
        createdAt: true,
        toolId: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.creatorBalance.findMany({
      select: { pendingAmount: true, availableAmount: true, settledAmount: true },
    }),
    // Top 5 tools by completed run count
    db.tool.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        name: true,
        price: true,
        _count: { select: { toolRuns: true } },
        toolRuns: {
          where: { status: "COMPLETED" },
          select: { platformFee: true, salePrice: true },
        },
        creator: { select: { name: true } },
      },
      orderBy: { totalRuns: "desc" },
      take: 5,
    }),
    // Top 5 creators by settled + available balance
    db.creatorBalance.findMany({
      orderBy: { settledAmount: "desc" },
      take: 5,
      select: {
        settledAmount: true,
        pendingAmount: true,
        availableAmount: true,
        creator: { select: { name: true, email: true } },
      },
    }),
    // Users registered in the last 30 days, grouped by day
    db.user.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // ── Aggregate run stats ───────────────────────────────────────────────────
  const completedRuns = runs.filter((r) => r.status === "COMPLETED");
  const gmv = completedRuns.reduce((s, r) => s + r.salePrice, 0);
  const platformRevenue = completedRuns.reduce((s, r) => s + (r.platformFee ?? 0), 0);
  const totalCreatorEarnings = completedRuns.reduce((s, r) => s + (r.creatorEarning ?? 0), 0);

  const runStatusCounts: Record<string, number> = {};
  for (const r of runs) runStatusCounts[r.status] = (runStatusCounts[r.status] ?? 0) + 1;

  const toolStatusCounts: Record<string, number> = {};
  for (const g of toolGroups) toolStatusCounts[g.status] = g._count;
  const totalTools = toolGroups.reduce((s, g) => s + g._count, 0);

  // ── Settled creator balance totals ────────────────────────────────────────
  const totalSettled = balances.reduce((s, b) => s + b.settledAmount, 0);
  const totalPending = balances.reduce((s, b) => s + b.pendingAmount, 0);

  // ── Monthly stats — last 6 months ─────────────────────────────────────────
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString("default", { month: "short", year: "2-digit" }) };
  });

  const monthlyStats = months.map(({ year, month, label }) => {
    const monthRuns = runs.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const done = monthRuns.filter((r) => r.status === "COMPLETED");
    return {
      label,
      runs: monthRuns.length,
      gmv: done.reduce((s, r) => s + r.salePrice, 0),
      revenue: done.reduce((s, r) => s + (r.platformFee ?? 0), 0),
    };
  });

  // ── New users per week (last 4 weeks) ─────────────────────────────────────
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const start = new Date(now.getTime() - (3 - i + 1) * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() - (3 - i) * 7 * 24 * 60 * 60 * 1000);
    return {
      label: `Wk ${i + 1}`,
      count: recentUsers.filter((u) => {
        const d = new Date(u.createdAt);
        return d >= start && d < end;
      }).length,
    };
  });

  // ── Top tools enriched ────────────────────────────────────────────────────
  const topToolsEnriched = topTools.map((t) => ({
    id: t.id,
    name: t.name,
    price: t.price,
    creator: t.creator?.name ?? "Unknown",
    completedRuns: t.toolRuns.length,
    totalRuns: t._count.toolRuns,
    gmv: t.toolRuns.reduce((s, r) => s + r.salePrice, 0),
    platformRevenue: t.toolRuns.reduce((s, r) => s + (r.platformFee ?? 0), 0),
  }));

  return {
    totalUsers,
    totalCreators,
    activeCreators,
    totalTools,
    toolStatusCounts,
    totalRuns: runs.length,
    completedRuns: completedRuns.length,
    runStatusCounts,
    gmv,
    platformRevenue,
    totalCreatorEarnings,
    totalSettled,
    totalPending,
    monthlyStats,
    weeks,
    topToolsEnriched,
    topCreators,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOOL_STATUS_META: Record<string, { label: string; bar: string; text: string }> = {
  APPROVED:       { label: "Approved",       bar: "bg-[#00C896]",   text: "text-[#00C896]" },
  PENDING_REVIEW: { label: "Pending Review", bar: "bg-yellow-400",  text: "text-yellow-400" },
  DRAFT:          { label: "Draft",          bar: "bg-slate-500",   text: "text-slate-400" },
  REJECTED:       { label: "Rejected",       bar: "bg-red-400",     text: "text-red-400" },
};

const RUN_STATUS_META: Record<string, { label: string; bar: string; text: string }> = {
  COMPLETED:       { label: "Completed",       bar: "bg-[#00C896]",   text: "text-[#00C896]" },
  PENDING_PAYMENT: { label: "Pending Payment", bar: "bg-yellow-400",  text: "text-yellow-400" },
  FAILED:          { label: "Failed",          bar: "bg-red-400",     text: "text-red-400" },
  PAID:            { label: "Paid",            bar: "bg-blue-400",    text: "text-blue-400" },
  EXECUTING:       { label: "Executing",       bar: "bg-purple-400",  text: "text-purple-400" },
  REFUNDED:        { label: "Refunded",        bar: "bg-orange-400",  text: "text-orange-400" },
};

function pct(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function BarChart({ data, valueKey, color }: { data: { label: string; [k: string]: number | string }[]; valueKey: string; color: string }) {
  const max = Math.max(...data.map((d) => d[valueKey] as number), 1);
  return (
    <div className="flex items-end gap-2 h-20">
      {data.map((d) => {
        const val = d[valueKey] as number;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
              <div
                className={`w-full rounded-t-md transition-colors ${color}`}
                style={{ height: `${pct(val, max)}%`, minHeight: val ? "4px" : "0" }}
                title={String(val)}
              />
            </div>
            <span className="text-[10px] text-slate-500 tabular-nums">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const data = await getAdminAnalytics();

  const conversionRate = pct(data.completedRuns, data.totalRuns);
  const maxMonthRuns = Math.max(...data.monthlyStats.map((m) => m.runs), 1);
  const maxMonthGmv = Math.max(...data.monthlyStats.map((m) => m.gmv), 1);
  const maxMonthRev = Math.max(...data.monthlyStats.map((m) => m.revenue), 1);
  const maxWeek = Math.max(...data.weeks.map((w) => w.count), 1);

  const SUMMARY = [
    { label: "Total Users",          value: data.totalUsers },
    { label: "Total Creators",        value: data.totalCreators },
    { label: "Active Creators",       value: data.activeCreators },
    { label: "Total Tools",           value: data.totalTools },
    { label: "Total Runs",            value: data.totalRuns },
    { label: "Conversion Rate",       value: `${conversionRate}%` },
    { label: "GMV",                   value: `$${data.gmv.toFixed(2)}` },
    { label: "Platform Revenue",      value: `$${data.platformRevenue.toFixed(2)}` },
  ];

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-slate-400 text-sm">Platform-wide performance overview</p>
      </div>

      {/* Summary stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {SUMMARY.map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-1.5">
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        {[
          { label: "Total GMV",               value: data.gmv,                  sub: "All completed sales" },
          { label: "Platform Revenue",         value: data.platformRevenue,      sub: "Platform fee share" },
          { label: "Total Creator Earnings",   value: data.totalCreatorEarnings, sub: "Paid to creators" },
        ].map((c) => (
          <div key={c.label} className="glass-card rounded-2xl p-5 sm:p-6">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2">{c.label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-[#00C896] tabular-nums">${c.value.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tool status + Run status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Tool status breakdown */}
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Tool Status Breakdown</h2>
          <div className="space-y-3.5">
            {Object.entries(TOOL_STATUS_META).map(([key, meta]) => {
              const count = data.toolStatusCounts[key] ?? 0;
              const percent = pct(count, data.totalTools);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>
                    <span className="text-xs text-slate-500 tabular-nums">
                      {count} <span className="text-white/25">({percent}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                    <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Run status breakdown */}
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Run Status Breakdown</h2>
          {data.totalRuns === 0 ? (
            <p className="text-slate-500 text-sm">No runs yet.</p>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(RUN_STATUS_META).map(([key, meta]) => {
                const count = data.runStatusCounts[key] ?? 0;
                const percent = pct(count, data.totalRuns);
                if (!count) return null;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium ${meta.text}`}>{meta.label}</span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {count} <span className="text-white/25">({percent}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                      <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly charts */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 mb-4">
        <h2 className="text-sm font-semibold text-white mb-1">Monthly Activity</h2>
        <p className="text-[11px] text-slate-500 mb-6">Last 6 months</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Runs</p>
            <div className="flex items-end gap-2 h-20">
              {data.monthlyStats.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                    <div
                      className="w-full rounded-t-md bg-[#00C896]/40 hover:bg-[#00C896]/60 transition-colors"
                      style={{ height: `${pct(m.runs, maxMonthRuns)}%`, minHeight: m.runs ? "4px" : "0" }}
                      title={`${m.runs} runs`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">GMV</p>
            <div className="flex items-end gap-2 h-20">
              {data.monthlyStats.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                    <div
                      className="w-full rounded-t-md bg-blue-400/50 hover:bg-blue-400/70 transition-colors"
                      style={{ height: `${pct(m.gmv, maxMonthGmv)}%`, minHeight: m.gmv ? "4px" : "0" }}
                      title={`$${m.gmv.toFixed(2)}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Platform Revenue</p>
            <div className="flex items-end gap-2 h-20">
              {data.monthlyStats.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                    <div
                      className="w-full rounded-t-md bg-[#00C896]/80 hover:bg-[#00C896] transition-colors"
                      style={{ height: `${pct(m.revenue, maxMonthRev)}%`, minHeight: m.revenue ? "4px" : "0" }}
                      title={`$${m.revenue.toFixed(2)}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New users (weekly) */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 mb-4">
        <h2 className="text-sm font-semibold text-white mb-1">New User Signups</h2>
        <p className="text-[11px] text-slate-500 mb-5">Last 4 weeks</p>
        <div className="flex items-end gap-3 h-16">
          {data.weeks.map((w) => (
            <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: "48px" }}>
                <div
                  className="w-full rounded-t-md bg-purple-400/50 hover:bg-purple-400/70 transition-colors"
                  style={{ height: `${pct(w.count, maxWeek)}%`, minHeight: w.count ? "4px" : "0" }}
                  title={`${w.count} users`}
                />
              </div>
              <span className="text-[10px] text-slate-500">{w.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">Total last 30 days: <span className="text-white font-semibold">{data.weeks.reduce((s, w) => s + w.count, 0)}</span></p>
      </div>

      {/* Two-col: Top tools + Top creators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Top tools */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Top Performing Tools</h2>
            <span className="text-xs text-slate-500">by completed runs</span>
          </div>
          {data.topToolsEnriched.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No approved tools yet.</p>
          ) : (
            <div>
              {data.topToolsEnriched.map((t, i) => (
                <div key={t.id} className={`px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors ${i < data.topToolsEnriched.length - 1 ? "border-b border-white/5" : ""}`}>
                  <span className="text-slate-600 text-sm font-bold w-4 shrink-0 tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{t.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">by {t.creator} · ${t.price.toFixed(2)}/run</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#00C896] text-sm font-semibold tabular-nums">${t.gmv.toFixed(2)}</p>
                    <p className="text-slate-500 text-xs">{t.completedRuns} / {t.totalRuns} runs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top creators */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Top Creators</h2>
            <span className="text-xs text-slate-500">by settled earnings</span>
          </div>
          {data.topCreators.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No creator balances yet.</p>
          ) : (
            <div>
              {data.topCreators.map((c, i) => (
                <div key={i} className={`px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors ${i < data.topCreators.length - 1 ? "border-b border-white/5" : ""}`}>
                  <span className="text-slate-600 text-sm font-bold w-4 shrink-0 tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{c.creator.name ?? "Unnamed"}</p>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{c.creator.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#00C896] text-sm font-semibold tabular-nums">${c.settledAmount.toFixed(2)}</p>
                    <p className="text-slate-500 text-xs">${c.pendingAmount.toFixed(2)} pending</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Balance summary */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Creator Balance Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Settled (Paid Out)", value: data.totalSettled,  color: "text-[#00C896]" },
            { label: "Total Pending",             value: data.totalPending,  color: "text-yellow-400" },
            { label: "Creator Earnings (Lifetime)", value: data.totalCreatorEarnings, color: "text-white" },
          ].map((b) => (
            <div key={b.label}>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{b.label}</p>
              <p className={`text-xl sm:text-2xl font-bold tabular-nums ${b.color}`}>${b.value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
