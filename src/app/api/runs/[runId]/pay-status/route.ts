import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const LOCUS_API_BASE =
  process.env.LOCUS_API_BASE ?? "https://api.paywithlocus.com/api";
const LOCUS_API_KEY = process.env.LOCUS_API_KEY ?? "";

function locusFetch(path: string) {
  return fetch(`${LOCUS_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${LOCUS_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * GET /api/runs/[runId]/pay-status
 * Client polls this every few seconds after initiating payment.
 * Checks Locus once per call; updates DB and triggers execution when confirmed.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const run = await db.toolRun.findUnique({
    where: { id: runId },
    include: { payment: true },
  });

  if (!run || !run.payment) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  // Already past payment — nothing to do
  if (run.status === "PAID" || run.status === "EXECUTING" || run.status === "COMPLETED") {
    return NextResponse.json({ status: run.status });
  }

  if (run.status === "FAILED") {
    return NextResponse.json({ status: "FAILED" });
  }

  const transactionId = run.payment.externalReference;
  if (!transactionId) {
    return NextResponse.json({ status: "pending" });
  }

  // Check transaction status with Locus once
  const pollRes = await locusFetch(`/checkout/agent/payments/${transactionId}`);
  if (!pollRes.ok) {
    return NextResponse.json({ status: "pending" });
  }

  const pollData = await pollRes.json();
  const txStatus: string =
    (pollData.data?.status as string | undefined) ??
    (pollData.status as string | undefined) ??
    "";

  if (txStatus === "FAILED" || txStatus === "POLICY_REJECTED") {
    await db.payment.update({
      where: { id: run.payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ status: "FAILED", error: `Payment ${txStatus.toLowerCase()}` });
  }

  if (txStatus !== "CONFIRMED") {
    return NextResponse.json({ status: "pending" });
  }

  // Atomically mark as confirmed + PAID (idempotent with upsert-style check)
  await db.$transaction([
    db.payment.update({
      where: { id: run.payment.id },
      data: { status: "CONFIRMED" },
    }),
    db.toolRun.update({
      where: { id: runId },
      data: { status: "PAID", paymentId: run.payment.id },
    }),
  ]);

  // Trigger execution — call the internal runs POST endpoint (fire and forget)
  const baseUrl = `http://localhost:${process.env.PORT ?? 3000}`;
  fetch(`${baseUrl}/api/runs/${runId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(console.error);

  return NextResponse.json({ status: "PAID" });
}
