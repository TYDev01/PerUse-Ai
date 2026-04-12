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

  // Pay the checkout session via Locus agent checkout API (deducts from our wallet)
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

  // Poll until CONFIRMED (up to 60 seconds, 2s intervals)
  let confirmed = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollRes = await locusFetch(`/checkout/agent/payments/${transactionId}`);
    if (pollRes.ok) {
      const pollData = await pollRes.json();
      const status: string =
        (pollData.data?.status as string | undefined) ??
        (pollData.status as string | undefined) ??
        "";

      if (status === "CONFIRMED") {
        confirmed = true;
        break;
      }
      if (status === "FAILED" || status === "POLICY_REJECTED") {
        return NextResponse.json({ error: `Payment ${status.toLowerCase()}` }, { status: 402 });
      }
    }
  }

  if (!confirmed) {
    return NextResponse.json({ error: "Payment confirmation timed out" }, { status: 408 });
  }

  // Mark payment confirmed + run as PAID
  await db.$transaction([
    db.payment.update({
      where: { id: run.payment.id },
      data: { status: "CONFIRMED", externalReference: transactionId },
    }),
    db.toolRun.update({
      where: { id: runId },
      data: { status: "PAID", paymentId: run.payment.id },
    }),
  ]);

  // Trigger execution (fire and forget)
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  fetch(`${appUrl}/api/runs/${runId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(console.error);

  return NextResponse.json({ status: "PAID", transactionId });
}
