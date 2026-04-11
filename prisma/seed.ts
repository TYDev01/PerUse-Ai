import { PrismaClient, ToolType, ToolStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123!", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@peruseai.com" },
    update: {},
    create: {
      email: "admin@peruseai.com",
      name: "Admin",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  // Create creator user
  const creatorHash = await bcrypt.hash("creator123!", 12);
  const creator = await db.user.upsert({
    where: { email: "creator@peruseai.com" },
    update: {},
    create: {
      email: "creator@peruseai.com",
      name: "Demo Creator",
      passwordHash: creatorHash,
      role: Role.CREATOR,
      creatorBalance: { create: {} },
    },
  });

  // Create test user
  const userHash = await bcrypt.hash("user123!", 12);
  await db.user.upsert({
    where: { email: "user@peruseai.com" },
    update: {},
    create: {
      email: "user@peruseai.com",
      name: "Demo User",
      passwordHash: userHash,
      role: Role.USER,
    },
  });

  // ── Tool 1: Summarize PDF ──────────────────────────────────────────────
  const pdfTool = await db.tool.upsert({
    where: { slug: "summarize-pdf" },
    update: { status: ToolStatus.APPROVED, featured: true },
    create: {
      creatorId: creator.id,
      name: "Summarize PDF",
      slug: "summarize-pdf",
      shortDescription: "Upload a PDF URL and get a crisp, structured summary powered by AI.",
      fullDescription:
        "Paste the URL of any publicly accessible PDF document and receive a comprehensive, well-structured summary. Perfect for research papers, legal documents, reports, and whitepapers. The AI extracts key points, conclusions, and action items so you can digest content 10x faster.",
      category: "Productivity",
      tags: ["pdf", "summary", "research", "documents"],
      coverImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      type: ToolType.PROMPT_TEMPLATE,
      status: ToolStatus.APPROVED,
      price: 0.25,
      featured: true,
    },
  });

  await db.toolInputField.deleteMany({ where: { toolId: pdfTool.id } });
  await db.toolInputField.createMany({
    data: [
      {
        toolId: pdfTool.id,
        key: "pdf_url",
        label: "PDF URL",
        type: "URL",
        required: true,
        placeholder: "https://example.com/document.pdf",
        helperText: "Paste the public URL of a PDF document",
        sortOrder: 0,
      },
      {
        toolId: pdfTool.id,
        key: "focus_areas",
        label: "Focus Areas (optional)",
        type: "TEXT",
        required: false,
        placeholder: "e.g. key findings, methodology, conclusions",
        helperText: "Tell the AI what to focus on",
        sortOrder: 1,
      },
    ],
  });

  await db.toolExecutionConfig.upsert({
    where: { toolId: pdfTool.id },
    update: {},
    create: {
      toolId: pdfTool.id,
      provider: "openai",
      model: "gpt-4o-mini",
      configJson: {
        systemPrompt:
          "You are an expert document analyst. When given a PDF URL and optional focus areas, fetch and analyze the document then produce a clear, well-structured summary. Include: Executive Summary, Key Points (bullet list), Main Conclusions, and Action Items if applicable. Be concise yet comprehensive.",
        promptTemplate:
          "Please analyze and summarize the PDF document at this URL: {{pdf_url}}\n\n{{focus_areas}}",
        maxTokens: 2000,
        temperature: 0.3,
      },
    },
  });

  // ── Tool 2: Review Code ────────────────────────────────────────────────
  const codeTool = await db.tool.upsert({
    where: { slug: "review-code" },
    update: { status: ToolStatus.APPROVED, featured: true },
    create: {
      creatorId: creator.id,
      name: "Review Code",
      slug: "review-code",
      shortDescription: "Get expert AI code review with bugs, security issues, and improvement suggestions.",
      fullDescription:
        "Submit your code and receive a thorough and professional review covering correctness, security vulnerabilities (OWASP), performance bottlenecks, code style, and actionable refactoring suggestions. Supports all major programming languages. Great for pre-PR reviews, learning, and maintaining code quality.",
      category: "Developer Tools",
      tags: ["code", "review", "security", "debugging", "refactoring"],
      coverImageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
      type: ToolType.PROMPT_TEMPLATE,
      status: ToolStatus.APPROVED,
      price: 0.35,
      featured: true,
    },
  });

  await db.toolInputField.deleteMany({ where: { toolId: codeTool.id } });
  await db.toolInputField.createMany({
    data: [
      {
        toolId: codeTool.id,
        key: "code",
        label: "Code to Review",
        type: "TEXTAREA",
        required: true,
        placeholder: "Paste your code here...",
        helperText: "Paste the code you want reviewed",
        sortOrder: 0,
      },
      {
        toolId: codeTool.id,
        key: "language",
        label: "Programming Language",
        type: "SELECT",
        required: true,
        options: ["JavaScript", "TypeScript", "Python", "Rust", "Go", "Java", "C#", "Other"],
        sortOrder: 1,
      },
      {
        toolId: codeTool.id,
        key: "focus",
        label: "Review Focus",
        type: "SELECT",
        required: false,
        options: ["General", "Security", "Performance", "Readability", "All"],
        placeholder: "All",
        sortOrder: 2,
      },
    ],
  });

  await db.toolExecutionConfig.upsert({
    where: { toolId: codeTool.id },
    update: {},
    create: {
      toolId: codeTool.id,
      provider: "openai",
      model: "gpt-4o",
      configJson: {
        systemPrompt:
          "You are a senior software engineer and security expert performing code reviews. Analyze code thoroughly for: 1) Bugs and logic errors, 2) Security vulnerabilities (OWASP Top 10), 3) Performance issues, 4) Code quality and best practices, 5) Specific improvements with corrected code examples. Be concrete and actionable. Format your response in clear sections.",
        promptTemplate:
          "Review this {{language}} code:\n\nFocus: {{focus}}\n\n```{{language}}\n{{code}}\n```\n\nProvide a thorough code review.",
        maxTokens: 3000,
        temperature: 0.2,
      },
    },
  });

  // ── Tool 3: Research Topic ─────────────────────────────────────────────
  const researchTool = await db.tool.upsert({
    where: { slug: "research-topic" },
    update: { status: ToolStatus.APPROVED, featured: true },
    create: {
      creatorId: creator.id,
      name: "Research Topic",
      slug: "research-topic",
      shortDescription: "Deep-dive research on any topic using live web search and AI synthesis.",
      fullDescription:
        "Enter any topic and get a comprehensive research report synthesized from live web sources. The AI searches the web, scrapes top results, and produces a well-structured report with key insights, current trends, expert perspectives, and references. Ideal for market research, academic study, competitive analysis, and staying informed.",
      category: "Research",
      tags: ["research", "web-search", "analysis", "report", "intelligence"],
      coverImageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800",
      type: ToolType.RESEARCH_WORKFLOW,
      status: ToolStatus.APPROVED,
      price: 0.50,
      featured: true,
    },
  });

  await db.toolInputField.deleteMany({ where: { toolId: researchTool.id } });
  await db.toolInputField.createMany({
    data: [
      {
        toolId: researchTool.id,
        key: "topic",
        label: "Research Topic",
        type: "TEXT",
        required: true,
        placeholder: "e.g. Impact of AI on healthcare in 2025",
        helperText: "Be specific for better results",
        sortOrder: 0,
      },
      {
        toolId: researchTool.id,
        key: "depth",
        label: "Research Depth",
        type: "SELECT",
        required: false,
        options: ["Quick Overview", "Standard Report", "Deep Analysis"],
        placeholder: "Standard Report",
        sortOrder: 1,
      },
    ],
  });

  await db.toolExecutionConfig.upsert({
    where: { toolId: researchTool.id },
    update: {},
    create: {
      toolId: researchTool.id,
      provider: "openai",
      model: "gpt-4o",
      configJson: {
        topicField: "topic",
        searchQueryTemplate: "{{topic}} latest research 2025",
        scrapeEnabled: true,
        summarizationPrompt:
          "You are an expert research analyst. Synthesize the following web research into a comprehensive, well-structured report.",
        outputStructureInstructions:
          "Format as: Executive Summary | Key Findings (numbered) | Current Trends | Expert Insights | Conclusion | Sources Referenced",
      },
    },
  });

  await db.toolReview.createMany({
    data: [
      { toolId: pdfTool.id, adminId: admin.id, action: "APPROVE" },
      { toolId: codeTool.id, adminId: admin.id, action: "APPROVE" },
      { toolId: researchTool.id, adminId: admin.id, action: "APPROVE" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seeded successfully.");
  console.log("Demo accounts:");
  console.log("  Admin:   admin@peruseai.com / admin123!");
  console.log("  Creator: creator@peruseai.com / creator123!");
  console.log("  User:    user@peruseai.com / user123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
