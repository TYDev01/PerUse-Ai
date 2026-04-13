import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const LOCUS_API_BASE =
  process.env.LOCUS_API_BASE ?? "https://api.paywithlocus.com/api";
const LOCUS_API_KEY = process.env.LOCUS_API_KEY ?? "";

function locusFetch(path: string, init?: RequestInit) {
  return fetch(`${LOCUS_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOCUS_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const run = await db.toolRun.findUnique({
    where: { id: runId },
    include: { payment: true },
  });

  if (!run || !run.payment?.externalSessionId) {
    return NextResponse.json({ error: "Run or payment not found" }, { status: 404 });
  }

  if (run.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Run is not awaiting payment" }, { status: 409 });
  }

  const sessionId = run.payment.externalSessionId;

  // Initiate payment via Locus agent checkout API
  const payRes = await locusFetch(`/checkout/agent/pay/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  if (!payRes.ok) {
    const err = await payRes.json().catch(() => ({}));
    const message = (err as { message?: string }).message ?? `Payment failed: ${payRes.status}`;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const payData = await payRes.json();
  const transactionId: string =
    (payData.data?.transactionId as string | undefined) ??
    (payData.transactionId as string | undefined) ??
    "";

  if (!transactionId) {
    return NextResponse.json({ error: "No transaction ID returned from Locus" }, { status: 500 });
  }

  // Store transactionId so the client can poll /pay-status
  await db.payment.update({
    where: { id: run.payment.id },
    data: { externalReference: transactionId },
  });

  // Return immediately — client will poll /pay-status for confirmation
  return NextResponse.json({ status: "pending", transactionId });
}
