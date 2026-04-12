"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface RunData {
  id: string;
  status: string;
  salePrice: number;
  tool: { name: string; slug: string };
  payment: { externalSessionId: string | null; status: string } | null;
}

export default function CheckoutClient({ runId }: { runId: string }) {
  const router = useRouter();
  const [run, setRun] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRun(data);

        if (data.status === "COMPLETED" || data.status === "FAILED") {
          router.push(`/result/${runId}`);
        }
      }
    } catch {}
    setLoading(false);
  }, [runId, router]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  // Poll for status updates after payment
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRun(data);
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          setPolling(false);
          router.push(`/result/${runId}`);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [polling, runId, router]);

  async function handlePay() {
    if (!run) return;
    setPaying(true);
    setError("");
    try {
      const res = await fetch(`/api/runs/${runId}/pay`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Payment failed");
      }
      setPolling(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setPaying(false);
    }
  }

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
          <p className="text-slate-400">This run may have expired or doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C896] to-[#009e78] flex items-center justify-center text-3xl mx-auto mb-4">
              💳
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Complete Payment</h1>
            <p className="text-slate-400 text-sm">{run.tool.name}</p>
          </div>

          {/* Amount */}
          <div className="glass rounded-2xl p-5 mb-6 text-center">
            <div className="text-4xl font-bold text-white mb-1">
              ${run.salePrice.toFixed(2)}
            </div>
            <div className="text-slate-400 text-sm">USDC on Base</div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            {[
              { label: "Tool", value: run.tool.name },
              { label: "Run ID", value: run.id.slice(0, 16) + "..." },
              { label: "Network", value: "Base (Ethereum L2)" },
              { label: "Provider", value: "Locus Pay" },
            ].map((d) => (
              <div key={d.label} className="flex justify-between text-sm">
                <span className="text-slate-400">{d.label}</span>
                <span className="text-slate-200 font-medium">{d.value}</span>
              </div>
            ))}
          </div>

          {polling ? (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-2 border-[#00C896]/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-300 text-sm">Payment received. Executing tool...</p>
              <p className="text-slate-500 text-xs mt-1">This usually takes 10-30 seconds</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                  {error}
                </div>
              )}

              {/* Pay with Locus button */}
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-4 rounded-xl bg-[#00C896] hover:bg-[#00b585] disabled:opacity-50 text-white font-semibold text-lg transition-all glow-primary mb-3"
              >
                {paying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Pay with Locus (USDC)"
                )}
              </button>

              <p className="text-center text-xs text-slate-500">
                Secured by Locus · Payments on Base network
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
