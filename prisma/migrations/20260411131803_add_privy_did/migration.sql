-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'CREATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ToolType" AS ENUM ('PROMPT_TEMPLATE', 'RESEARCH_WORKFLOW');

-- CreateEnum
CREATE TYPE "InputFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'URL', 'SELECT');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'EXECUTING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "privyDid" TEXT,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "coverImageUrl" TEXT,
    "type" "ToolType" NOT NULL,
    "status" "ToolStatus" NOT NULL DEFAULT 'DRAFT',
    "price" DOUBLE PRECISION NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_input_fields" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "InputFieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "placeholder" TEXT,
    "helperText" TEXT,
    "options" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tool_input_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_execution_configs" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_execution_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_runs" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "inputJson" JSONB NOT NULL,
    "outputJson" JSONB,
    "outputText" TEXT,
    "status" "RunStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "provider" TEXT,
    "model" TEXT,
    "providerCost" DOUBLE PRECISION,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION,
    "creatorEarning" DOUBLE PRECISION,
    "paymentId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tool_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "toolRunId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'locus',
    "externalSessionId" TEXT,
    "externalReference" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "webhookPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_reviews" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_balances" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "pendingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "settledAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_privyDid_key" ON "users"("privyDid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tools_slug_key" ON "tools"("slug");

-- CreateIndex
CREATE INDEX "tools_status_category_idx" ON "tools"("status", "category");

-- CreateIndex
CREATE INDEX "tools_slug_idx" ON "tools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tool_execution_configs_toolId_key" ON "tool_execution_configs"("toolId");

-- CreateIndex
CREATE INDEX "tool_runs_toolId_idx" ON "tool_runs"("toolId");

-- CreateIndex
CREATE INDEX "tool_runs_userId_idx" ON "tool_runs"("userId");

-- CreateIndex
CREATE INDEX "tool_runs_sessionId_idx" ON "tool_runs"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_toolRunId_key" ON "payments"("toolRunId");

-- CreateIndex
CREATE UNIQUE INDEX "creator_balances_creatorId_key" ON "creator_balances"("creatorId");

-- AddForeignKey
ALTER TABLE "tools" ADD CONSTRAINT "tools_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_input_fields" ADD CONSTRAINT "tool_input_fields_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_execution_configs" ADD CONSTRAINT "tool_execution_configs_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_runs" ADD CONSTRAINT "tool_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_toolRunId_fkey" FOREIGN KEY ("toolRunId") REFERENCES "tool_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_reviews" ADD CONSTRAINT "tool_reviews_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_reviews" ADD CONSTRAINT "tool_reviews_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_balances" ADD CONSTRAINT "creator_balances_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
