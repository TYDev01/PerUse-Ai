import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AdminToolReviewClient from "./ToolReviewClient";

async function getTool(id: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/admin/tools?id=${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.tools?.[0] ?? null;
}

export default async function AdminToolReviewPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const tool = await getTool(params.id);
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
