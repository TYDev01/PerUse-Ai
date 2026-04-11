"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-500/20 text-slate-400",
  PENDING_REVIEW: "bg-yellow-500/20 text-yellow-400",
  APPROVED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

export default function AdminToolReviewClient({ tool }: { tool: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  async function review(action: "approve" | "reject") {
    setLoading(action);
    const res = await fetch(`/api/admin/tools/${tool.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes: notes || undefined }),
    });
    setLoading(null);
    if (res.ok) router.push("/admin/tools");
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{tool.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tool.status] ?? ""}`}>
                {tool.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-slate-400">{tool.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
              <span>by <span className="text-slate-300">{tool.creator?.name ?? "Unknown"}</span></span>
              <span>·</span>
              <span>{tool.category}</span>
              <span>·</span>
              <span>{tool.toolType?.replace("_", " ")}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-white">${tool.salePrice?.toFixed(2)}</div>
            <div className="text-sm text-slate-400">per run</div>
          </div>
        </div>
      </div>

      {/* Input fields */}
      {tool.inputFields?.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Input Fields</h2>
          <div className="space-y-3">
            {tool.inputFields.map((f: any) => (
              <div key={f.id} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                <code className="text-[#00C896] text-sm bg-white/5 px-2 py-0.5 rounded">
                  {`{{${f.key}}}`}
                </code>
                <span className="text-white text-sm">{f.label}</span>
                <span className="text-slate-500 text-xs">{f.fieldType}</span>
                {f.required && <span className="text-xs text-yellow-500">required</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution config */}
      {tool.executionConfig && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Execution Config</h2>
          <div className="flex items-center gap-4 mb-3 text-sm">
            <span className="text-slate-400">Provider:</span>
            <span className="text-white">{tool.executionConfig.provider}</span>
            <span className="text-slate-400">Model:</span>
            <span className="text-white">{tool.executionConfig.model}</span>
          </div>
          <pre className="bg-black/30 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto">
            {JSON.stringify(tool.executionConfig.configJson, null, 2)}
          </pre>
        </div>
      )}

      {/* Tags */}
      {tool.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tool.tags.map((tag: string) => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full glass text-slate-400">{tag}</span>
          ))}
        </div>
      )}

      {/* Review action */}
      {tool.status === "PENDING_REVIEW" && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Review Decision</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-200 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Feedback for the creator..."
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => review("approve")}
              disabled={loading !== null}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            >
              {loading === "approve" ? "Approving..." : "✓ Approve"}
            </button>
            <button
              onClick={() => review("reject")}
              disabled={loading !== null}
              className="flex-1 py-3 rounded-xl bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            >
              {loading === "reject" ? "Rejecting..." : "✕ Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
