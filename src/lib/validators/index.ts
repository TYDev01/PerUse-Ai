import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["USER", "CREATOR"]).default("USER"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createToolSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().min(2).max(200),
  fullDescription: z.string().min(2).max(5000),
  category: z.string().min(2).max(50),
  tags: z.array(z.string()).max(10).default([]),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["PROMPT_TEMPLATE", "RESEARCH_WORKFLOW"]),
  price: z.number().positive().max(1000),
  inputFields: z.array(
    z.object({
      key: z.string().min(1).max(50),
      label: z.string().min(1).max(100),
      type: z.enum(["TEXT", "TEXTAREA", "URL", "SELECT"]),
      required: z.boolean().default(true),
      placeholder: z.string().optional(),
      helperText: z.string().optional(),
      options: z.array(z.string()).default([]),
      sortOrder: z.number().int().default(0),
    })
  ),
  executionConfig: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    configJson: z.record(z.string(), z.unknown()),
  }),
});

export const reviewToolSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().max(500).optional(),
});

export const createRunSchema = z.object({
  toolId: z.string().min(1),
  inputJson: z.record(z.string(), z.unknown()),
  sessionId: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateToolInput = z.infer<typeof createToolSchema>;
export type ReviewToolInput = z.infer<typeof reviewToolSchema>;
export type CreateRunInput = z.infer<typeof createRunSchema>;
