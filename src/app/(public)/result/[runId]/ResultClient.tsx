"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface RunResult {
  id: string;
  status: string;
  outputText: string | null;
  outputJson: Record<string, unknown> | null;
  salePrice: number;
  providerCost: number | null;
  platformFee: number | null;
  creatorEarning: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  inputJson: Record<string, unknown>;
  tool: { name: string; slug: string };
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  PENDING_PAYMENT: { icon: "⏳", color: "text-yellow-400", label: "Awaiting payment" },
  PAID: { icon: "💳", color: "text-blue-400", label: "Payment received" },
  EXECUTING: { icon: "⚙️", color: "text-[#00C896]", label: "Executing..." },
  COMPLETED: { icon: "✅", color: "text-emerald-400", label: "Completed" },
  FAILED: { icon: "❌", color: "text-red-400", label: "Failed" },
  REFUNDED: { icon: "↩️", color: "text-orange-400", label: "Refunded" },
};

export default function ResultClient({ runId }: { runId: string }) {
  const [run, setRun] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRun(data);

        if (data.status === "EXECUTING" || data.status === "PAID") {
          setPolling(true);
        } else {
          setPolling(false);
        }
      }
    } catch {}
    setLoading(false);
  }, [runId]);

  useEffect(() => { fetchRun(); }, [fetchRun]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRun(data);
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          setPolling(false);
        }
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [polling, runId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00C896]/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">Run not found</h1>
          <Link href="/browse" className="text-[#00C896] hover:text-[#00C896] mt-4 inline-block">
            ← Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[run.status] ?? STATUS_CONFIG["COMPLETED"];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/tools/${run.tool.slug}`}
          className="text-[#00C896] hover:text-[#00C896] text-sm flex items-center gap-1 mb-4"
        >
          ← {run.tool.name}
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{statusInfo.icon}</span>
          <h1 className="text-3xl font-bold text-white">Run Result</h1>
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          {new Date(run.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Executing state */}
      {(run.status === "EXECUTING" || run.status === "PAID") && (
        <div className="glass-card rounded-2xl p-10 text-center mb-6">
          <div className="w-12 h-12 border-2 border-[#00C896]/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Executing your tool...</h2>
          <p className="text-slate-400 text-sm">
            The AI is processing your request. This usually takes 10-30 seconds.
          </p>
        </div>
      )}

      {/* Output */}
      {run.status === "COMPLETED" && run.outputText && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 text-lg">Output</h2>
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm font-mono bg-black/20 rounded-xl p-4 max-h-[600px] overflow-y-auto">
              {run.outputText}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {run.status === "FAILED" && (
        <div className="glass-card rounded-2xl p-6 mb-6 border-red-500/20">
          <h2 className="font-semibold text-red-400 mb-2">Execution Failed</h2>
          <p className="text-slate-300 text-sm">{run.errorMessage ?? "An unknown error occurred."}</p>
          <Link
            href={`/tools/${run.tool.slug}`}
            className="mt-4 inline-block px-4 py-2 rounded-lg bg-[#00C896] hover:bg-[#00b585] text-white text-sm"
          >
            Try again
          </Link>
        </div>
      )}

      {/* Your input */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-white mb-3">Your Input</h2>
        <div className="space-y-2">
          {Object.entries(run.inputJson).map(([key, value]) => (
            <div key={key} className="flex gap-3 text-sm">
              <span className="text-slate-400 min-w-[120px] capitalize">
                {key.replace(/_/g, " ")}:
              </span>
              <span className="text-slate-200 break-all">
                {String(value).slice(0, 200)}
                {String(value).length > 200 ? "..." : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Billing breakdown */}
      {run.status === "COMPLETED" && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4">Billing Breakdown</h2>
          <div className="space-y-2">
            {[
              { label: "Sale price", value: `$${run.salePrice.toFixed(4)} USDC` },
              {
                label: "Provider cost",
                value: run.providerCost != null
                  ? `$${run.providerCost.toFixed(6)} USDC`
                  : "—",
              },
              {
                label: "Platform fee",
                value: run.platformFee != null
                  ? `$${run.platformFee.toFixed(4)} USDC`
                  : "—",
              },
              {
                label: "Creator earning",
                value: run.creatorEarning != null
                  ? `$${run.creatorEarning.toFixed(4)} USDC`
                  : "—",
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-slate-400">{row.label}</span>
                <span className="text-slate-200 font-mono">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <Link
          href={`/tools/${run.tool.slug}`}
          className="px-6 py-3 rounded-xl glass hover:border-[#00C896]/40 text-slate-200 text-sm transition-all"
        >
          Run again
        </Link>
        <Link
          href="/browse"
          className="px-6 py-3 rounded-xl bg-[#00C896] hover:bg-[#00b585] text-white text-sm transition-all"
        >
          Browse more tools
        </Link>
      </div>
    </div>
  );
}
