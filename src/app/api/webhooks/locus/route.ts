import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { verifyWebhookSignature } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("locus-signature") ?? "";
  const secret = process.env.LOCUS_WEBHOOK_SECRET ?? "";

  if (secret && !(await verifyWebhookSignature(rawBody, signature, secret))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.session.paid") {
    const sessionId = event.data.id as string;
    const externalRef = event.data.transactionId as string | undefined;

    const payment = await db.payment.findFirst({
      where: { externalSessionId: sessionId },
      include: { toolRun: true },
    });

    if (!payment) {
      return NextResponse.json({ received: true });
    }

    await db.$transaction([
      db.payment.update({
        where: { id: payment.id },
        data: {
          status: "CONFIRMED",
          externalReference: externalRef,
          webhookPayload: event.data as Prisma.InputJsonValue,
        },
      }),
      db.toolRun.update({
        where: { id: payment.toolRunId },
        data: { status: "PAID", paymentId: payment.id },
      }),
    ]);

    // Trigger execution asynchronously via internal self-call
    const port = process.env.PORT ?? 3000;
    fetch(`http://localhost:${port}/api/runs/${payment.toolRunId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch(console.error);
  }

  return NextResponse.json({ received: true });
}
