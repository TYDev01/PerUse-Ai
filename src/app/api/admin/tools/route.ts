import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const tools = await db.tool.findMany({
    where: status ? { status: status as never } : undefined,
    include: {
      creator: { select: { name: true, email: true } },
      executionConfig: true,
      inputFields: { orderBy: { sortOrder: "asc" } },
      _count: { select: { toolRuns: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tools);
}
