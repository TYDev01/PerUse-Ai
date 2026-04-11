import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { executeTool } from "@/lib/execution";
import { calculateRevenueSplit } from "@/lib/pricing";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const run = await db.toolRun.findUnique({
    where: { id: runId },
    include: {
      tool: { select: { name: true, slug: true } },
      payment: true,
    },
  });

  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  return NextResponse.json(run);
}

/** Trigger execution after payment confirmation (called internally or by webhook) */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const run = await db.toolRun.findUnique({
    where: { id: runId },
    include: {
      tool: {
        include: { executionConfig: true },
      },
    },
  });

  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.status !== "PAID" && run.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Run not in executable state" }, { status: 409 });
  }
  if (!run.tool.executionConfig) {
    return NextResponse.json({ error: "No execution config" }, { status: 500 });
  }

  await db.toolRun.update({ where: { id: runId }, data: { status: "EXECUTING" } });

  try {
    const result = await executeTool({
      type: run.tool.type,
      provider: run.tool.executionConfig.provider,
      model: run.tool.executionConfig.model,
      configJson: run.tool.executionConfig.configJson as Record<string, unknown>,
      userInput: run.inputJson as Record<string, unknown>,
    });

    const { platformFee, creatorEarning } = calculateRevenueSplit(
      run.salePrice,
      result.providerCost
    );

    await db.$transaction([
      db.toolRun.update({
        where: { id: runId },
        data: {
          status: "COMPLETED",
          outputText: result.outputText,
          outputJson: (result.outputJson ?? {}) as Prisma.InputJsonValue,
          providerCost: result.providerCost,
          platformFee,
          creatorEarning,
          provider: run.tool.executionConfig!.provider,
          model: run.tool.executionConfig!.model,
        },
      }),
      db.tool.update({
        where: { id: run.toolId },
        data: { totalRuns: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ status: "COMPLETED", runId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execution failed";
    await db.toolRun.update({
      where: { id: runId },
      data: { status: "FAILED", errorMessage: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
