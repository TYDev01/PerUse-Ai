import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [tools, pendingCount, runs, payments] = await Promise.all([
    db.tool.groupBy({ by: ["status"], _count: true }),
    db.tool.count({ where: { status: "PENDING_REVIEW" } }),
    db.toolRun.findMany({
      select: { status: true, salePrice: true, platformFee: true, createdAt: true },
    }),
    db.payment.findMany({
      select: { status: true, amount: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const completedRuns = runs.filter((r) => r.status === "COMPLETED");
  const gmv = completedRuns.reduce((s, r) => s + r.salePrice, 0);
  const platformRevenue = completedRuns.reduce((s, r) => s + (r.platformFee ?? 0), 0);
  const failedRuns = runs.filter((r) => r.status === "FAILED").length;

  return NextResponse.json({
    toolsByStatus: Object.fromEntries(
      tools.map((g) => [g.status.toLowerCase(), g._count])
    ),
    pendingToolsCount: pendingCount,
    totalRuns: runs.length,
    completedRuns: completedRuns.length,
    failedRuns,
    gmv,
    platformRevenue,
    recentPayments: payments,
  });
}
