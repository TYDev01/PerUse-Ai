import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AdminToolReviewClient from "./ToolReviewClient";

import { db } from "@/lib/db";

async function getTool(id: string) {
  return db.tool.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true, email: true } },
      executionConfig: true,
      inputFields: { orderBy: { sortOrder: "asc" } },
      _count: { select: { toolRuns: true } },
    },
  });
}

export default async function AdminToolReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const tool = await getTool(id);
  if (!tool) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/tools" className="text-slate-400 hover:text-white text-sm">← All Tools</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 text-sm">{tool.name}</span>
      </div>

      <AdminToolReviewClient tool={tool} />
    </div>
  );
}
