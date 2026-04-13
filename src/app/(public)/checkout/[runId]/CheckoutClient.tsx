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
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [mockMode, setMockMode] = useState(false);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);
  const [mockPaying, setMockPaying] = useState(false);
  const [manualChecking, setManualChecking] = useState(false);

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (res.ok) {
        const data: RunData = await res.json();
        setRun(data);
        if (data.status === "PAID" || data.status === "EXECUTING") setPolling(true);
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

  // Auto-poll pay-status to get checkoutUrl and detect payment
  useEffect(() => {
    if (!run) return;
    if (polling || run.status === "COMPLETED" || run.status === "FAILED") return;

    const check = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}/pay-status`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.checkoutUrl) setCheckoutUrl(data.checkoutUrl);
        if (data.mockMode) setMockMode(true);
        if (data.status === "FAILED") {
          setError(data.error ?? "Payment failed");
        } else if (["PAID", "EXECUTING", "COMPLETED"].includes(data.status)) {
          setPolling(true);
        }
      } catch {}
    };

    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, [run?.status, runId, polling]);

  // Poll run status after payment confirmed, waiting for COMPLETED/FAILED
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        if (res.ok) {
          const data: RunData = await res.json();
          setRun(data);
          if (data.status === "COMPLETED" || data.status === "FAILED") {
            setPolling(false);
            router.push(`/result/${runId}`);
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [polling, runId, router]);

  async function handleMockPay() {
    setMockPaying(true);
    try {
      await fetch(`/api/runs/${runId}/pay-mock`, { method: "POST" });
      setPolling(true);
    } catch {
      setMockPaying(false);
    }
  }

  async function handleAlreadyPaid() {
    setManualChecking(true);
    try {
      const res = await fetch(`/api/runs/${runId}/pay-status`);
      if (res.ok) {
        const data = await res.json();
        if (["PAID", "EXECUTING", "COMPLETED"].includes(data.status)) {
          setPolling(true);
        }
      }
    } catch {}
    setManualChecking(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
    <div className="min-h-screen flex flex-col bg-black">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-bold text-white text-lg tracking-tight">
          Peruse<span className="text-[#00C896]">AI</span>
        </span>
        <span className="text-slate-500 text-sm">Secure Payment via Locus</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10">
        {polling ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-5" />
            <p className="text-white font-semibold text-lg">Payment received</p>
            <p className="text-slate-400 text-sm mt-1">Executing tool… this usually takes 10–30 seconds</p>
          </div>
        ) : error ? (
          <div className="w-full max-w-md text-center">
            <p className="text-2xl font-bold text-white mb-2">Payment failed</p>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
              {error}
            </div>
            <a
              href="/browse"
              className="inline-block py-3 px-6 rounded-xl text-slate-400 border border-white/10 hover:bg-white/5 text-sm transition-all"
            >
              Browse other tools
            </a>
          </div>
        ) : mockMode ? (
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-1">Hire {run.tool.name}</p>
            <p className="text-slate-400 mb-8">
              Pay {run.salePrice.toFixed(0)} USDC to start your task
            </p>
            <button
              onClick={handleMockPay}
              disabled={mockPaying}
              className="py-4 px-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-lg transition-all"
            >
              {mockPaying ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "Simulate Payment (Dev)"
              )}
            </button>
          </div>
        ) : checkoutUrl ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-1">Hire {run.tool.name}</h1>
              <p className="text-slate-400">
                Pay {run.salePrice.toFixed(0)} USDC to start your research task
              </p>
            </div>

            {/* Embedded Locus checkout */}
            <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <iframe
                src={checkoutUrl}
                className="w-full"
                style={{ height: "520px" }}
                allow="payment"
                title="Locus Checkout"
              />
            </div>

            {/* Fallback links */}
            <p className="text-slate-600 text-sm mt-5 text-center">
              Having trouble? Open checkout in a new tab:{" "}
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
              >
                Open Locus Checkout
              </a>
              {" | "}
              <button
                onClick={handleAlreadyPaid}
                disabled={manualChecking}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 disabled:opacity-50"
              >
                {manualChecking ? "Checking…" : "I already paid"}
              </button>
            </p>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading payment details…</p>
          </div>
        )}
      </div>
    </div>
  );
}
