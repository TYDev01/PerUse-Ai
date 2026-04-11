import { db } from "@/lib/db";
import LandingPage from "@/components/landing/LandingPage";

async function getFeaturedTools() {
  try {
    return await db.tool.findMany({
      where: { status: "APPROVED", featured: true },
      take: 3,
      include: { creator: { select: { name: true } } },
      orderBy: { totalRuns: "desc" },
    });
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const [toolCount, runCount] = await Promise.all([
      db.tool.count({ where: { status: "APPROVED" } }),
      db.toolRun.count({ where: { status: "COMPLETED" } }),
    ]);
    return { toolCount, runCount };
  } catch {
    return { toolCount: 0, runCount: 0 };
  }
}

export default async function HomePage() {
  const [featuredTools, stats] = await Promise.all([getFeaturedTools(), getStats()]);
  return <LandingPage featuredTools={featuredTools} stats={stats} />;
}
