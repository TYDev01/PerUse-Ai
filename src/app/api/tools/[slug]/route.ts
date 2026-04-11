import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const tool = await db.tool.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      inputFields: { orderBy: { sortOrder: "asc" } },
      executionConfig: { select: { provider: true, model: true } },
      creator: { select: { name: true } },
    },
  });

  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  return NextResponse.json(tool);
}
