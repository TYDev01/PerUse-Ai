import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { createToolSchema } from "@/lib/validators";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tools = await db.tool.findMany({
    where: { creatorId: session.user.id },
    include: {
      _count: { select: { toolRuns: true } },
      toolRuns: {
        select: { salePrice: true, creatorEarning: true, status: true },
        where: { status: "COMPLETED" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tools);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CREATOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createToolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { inputFields, executionConfig, tags, coverImageUrl, ...toolData } = parsed.data;

  const existing = await db.tool.findUnique({ where: { slug: toolData.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const tool = await db.tool.create({
    data: {
      ...toolData,
      coverImageUrl: coverImageUrl || null,
      tags,
      creatorId: session.user.id,
      status: "PENDING_REVIEW",
      inputFields: {
        create: inputFields.map((f) => ({ ...f, options: f.options ?? [] })),
      },
      executionConfig: {
        create: {
          ...executionConfig,
          configJson: executionConfig.configJson as Prisma.InputJsonValue,
        },
      },
    },
    include: { inputFields: true, executionConfig: true },
  });

  return NextResponse.json(tool, { status: 201 });
}
