import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ToolDetailClient from "./ToolDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await db.tool.findUnique({ where: { slug, status: "APPROVED" } });
  return {
    title: tool ? `${tool.name} — PerUse AI` : "Tool Not Found",
    description: tool?.shortDescription,
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tool = await db.tool.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      inputFields: { orderBy: { sortOrder: "asc" } },
      executionConfig: { select: { provider: true, model: true } },
      creator: { select: { name: true, email: true } },
    },
  });

  if (!tool) notFound();

  return <ToolDetailClient tool={tool} />;
}
