import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { createRunSchema } from "@/lib/validators";
import { createCheckoutSession } from "@/lib/payments";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { toolId, inputJson, sessionId } = parsed.data;

    const tool = await db.tool.findUnique({
      where: { id: toolId, status: "APPROVED" },
    });
    if (!tool) {
      return NextResponse.json({ error: "Tool not found or not approved" }, { status: 404 });
    }

    const runSessionId = sessionId ?? nanoid();
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    // Create the run record
    const run = await db.toolRun.create({
      data: {
        toolId,
        sessionId: runSessionId,
        inputJson: inputJson as Prisma.InputJsonValue,
        salePrice: tool.price,
        status: "PENDING_PAYMENT",
      },
    });

    // Create Locus checkout session
    const checkoutSession = await createCheckoutSession({
      amount: tool.price,
      description: `PerUse AI: ${tool.name}`,
      metadata: { runId: run.id, toolId: tool.id },
      webhookUrl: `${appUrl}/api/webhooks/locus`,
    });

    // Store payment record (including checkoutUrl — Locus only returns it on creation)
    await db.payment.create({
      data: {
        toolRunId: run.id,
        amount: tool.price,
        currency: "USDC",
        status: "PENDING",
        externalSessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.checkoutUrl,
      },
    });

    return NextResponse.json({
      runId: run.id,
      sessionId: runSessionId,
      checkoutSessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.checkoutUrl,
      amount: tool.price,
    }, { status: 201 });
  } catch (err) {
    console.error("Create run error:", err);
    return NextResponse.json({ error: "Failed to create run" }, { status: 500 });
  }
}
