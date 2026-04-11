import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { executeTool } from "@/lib/execution";
import { calculateRevenueSplit } from "@/lib/pricing";

/** Dev-only mock payment → execute endpoint */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const run = await db.toolRun.findUnique({
    where: { id: runId },
    include: { tool: { include: { executionConfig: true } }, payment: true },
  });

  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark payment as confirmed
  if (run.payment) {
    await db.payment.update({
      where: { id: run.payment.id },
      data: { status: "CONFIRMED", externalReference: `mock_${Date.now()}` },
    });
  }

  await db.toolRun.update({ where: { id: runId }, data: { status: "EXECUTING" } });

  // Execute in background (fire and forget with proper error handling)
  (async () => {
    try {
      if (!run.tool.executionConfig) throw new Error("No execution config");

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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Execution failed";
      await db.toolRun.update({
        where: { id: runId },
        data: { status: "FAILED", errorMessage: message },
      });
    }
  })();

  return NextResponse.json({ status: "EXECUTING" });
}
