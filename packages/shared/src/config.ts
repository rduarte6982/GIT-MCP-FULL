import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),

  DATABASE_URL: z.string().url(),
  DATABASE_DIRECT_URL: z.string().url().optional(),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  EMBEDDER_URL: z.string().url().default("http://localhost:8080"),
  EMBEDDING_DIM: z.coerce.number().int().default(1024),

  ANTHROPIC_API_KEY: z.string().optional(),
  COHERE_API_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_BASE: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_TEAM: z.string().optional(),

  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().optional(),
  SENTRY_DSN: z.string().optional(),

  JWT_SECRET: z.string().min(32).optional(),
  API_KEY_PEPPER: z.string().min(16).optional(),

  TRANSPORT: z.enum(["stdio", "http"]).default("http"),
  MCP_PORT: z.coerce.number().int().default(3001),
  DASHBOARD_API_PORT: z.coerce.number().int().default(3002),
  ALLOWED_ORIGINS: z.string().default(""),
});

export type SharedEnv = z.infer<typeof baseSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): SharedEnv {
  const parsed = baseSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
