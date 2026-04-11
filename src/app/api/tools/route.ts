import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("q") ?? undefined;
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 12;
  const skip = (page - 1) * limit;

  const where = {
    status: "APPROVED" as const,
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { shortDescription: { contains: search, mode: "insensitive" as const } },
            { tags: { has: search.toLowerCase() } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "price_asc"
      ? { price: "asc" as const }
      : sort === "price_desc"
      ? { price: "desc" as const }
      : sort === "popular"
      ? { totalRuns: "desc" as const }
      : { createdAt: "desc" as const };

  const [tools, total] = await Promise.all([
    db.tool.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        category: true,
        tags: true,
        coverImageUrl: true,
        type: true,
        price: true,
        featured: true,
        totalRuns: true,
        createdAt: true,
        creator: { select: { name: true } },
      },
    }),
    db.tool.count({ where }),
  ]);

  return NextResponse.json({ tools, total, page, pages: Math.ceil(total / limit) });
}
