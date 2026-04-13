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
 * Polled by the client every few seconds.
 * Checks the Locus checkout SESSION status (not agent transaction status),
 * so users can pay via Locus's hosted checkout page with their own wallet.
 * Returns { status, checkoutUrl? } — checkoutUrl is shown to the user until paid.
 */
export async function GET(
  _req: NextRequest,
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

  // Already confirmed or executing
  if (["PAID", "EXECUTING", "COMPLETED"].includes(run.status)) {
    return NextResponse.json({ status: run.status });
  }

  if (run.status === "FAILED") {
    return NextResponse.json({ status: "FAILED" });
  }

  const sessionId = run.payment.externalSessionId;
  if (!sessionId) {
    return NextResponse.json({ status: "pending" });
  }

  // Mock mode: no real Locus session exists
  if (sessionId.startsWith("mock_")) {
    return NextResponse.json({ status: "pending", mockMode: true });
  }

  // Serve the stored checkoutUrl from DB (Locus GET endpoint does not return it)
  const storedCheckoutUrl = (run.payment as { checkoutUrl?: string | null }).checkoutUrl ?? "";

  // Check session status from Locus
  const sessionRes = await locusFetch(`/checkout/sessions/${sessionId}`);
  if (!sessionRes.ok) {
    return NextResponse.json({ status: "pending", checkoutUrl: storedCheckoutUrl });
  }

  const sessionData = await sessionRes.json();
  const session = sessionData.data as {
    status?: string;
  } | null;

  const sessionStatus = session?.status ?? "";

  if (sessionStatus === "EXPIRED" || sessionStatus === "CANCELLED") {
    return NextResponse.json({
      status: "FAILED",
      error: "Payment session has expired. Please go back and start a new run.",
    });
  }

  // Not yet paid — return stored checkoutUrl so the client can show the iframe
  if (sessionStatus !== "PAID") {
    return NextResponse.json({ status: "pending", checkoutUrl: storedCheckoutUrl });
  }

  // Session is PAID — update DB and trigger execution (idempotent)
  await db.$transaction([
    db.payment.update({
      where: { id: run.payment.id },
      data: { status: "CONFIRMED" },
    }),
    db.toolRun.update({
      where: { id: runId },
      data: { status: "PAID" },
    }),
  ]);

  const port = process.env.PORT ?? 3000;
  fetch(`http://localhost:${port}/api/runs/${runId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(console.error);

  return NextResponse.json({ status: "PAID" });
}
