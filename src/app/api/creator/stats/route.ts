import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** GET /api/creator/stats */
export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [tools, runs, balance] = await Promise.all([
    db.tool.findMany({
      where: { creatorId: session.user.id },
      select: { id: true, status: true },
    }),
    db.toolRun.findMany({
      where: {
        tool: { creatorId: session.user.id },
      },
      select: { status: true, salePrice: true, creatorEarning: true },
    }),
    db.creatorBalance.findUnique({ where: { creatorId: session.user.id } }),
  ]);

  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === "COMPLETED");
  const totalRevenue = completedRuns.reduce((s, r) => s + (r.creatorEarning ?? 0), 0);
  const failedRuns = runs.filter((r) => r.status === "FAILED").length;

  return NextResponse.json({
    totalTools: tools.length,
    toolsByStatus: {
      draft: tools.filter((t) => t.status === "DRAFT").length,
      pendingReview: tools.filter((t) => t.status === "PENDING_REVIEW").length,
      approved: tools.filter((t) => t.status === "APPROVED").length,
      rejected: tools.filter((t) => t.status === "REJECTED").length,
    },
    totalRuns,
    completedRuns: completedRuns.length,
    failedRuns,
    totalRevenue,
    pendingBalance: balance?.pendingAmount ?? 0,
    availableBalance: balance?.availableAmount ?? 0,
  });
}
