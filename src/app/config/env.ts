import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/expenseiq_db?schema=public"),
  JWT_SECRET: z.string().default("supersecretjwtkey_expenseiq_2026_dev_mode"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  BETTER_AUTH_SECRET: z.string().optional().default("supersecretbetterauthkey_expenseiq_2026"),
  BETTER_AUTH_URL: z.string().optional().default("http://localhost:5000"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  GEMINI_API_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_SUBJECT: z.string().optional().default("mailto:admin@expenseiq.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const envVars = Object.freeze({
  NODE_ENV: parsed.data.NODE_ENV,
  PORT: parsed.data.PORT,
  DATABASE_URL: parsed.data.DATABASE_URL,
  JWT: {
    SECRET: parsed.data.JWT_SECRET,
    EXPIRES_IN: parsed.data.JWT_EXPIRES_IN,
  },
  BETTER_AUTH: {
    SECRET: parsed.data.BETTER_AUTH_SECRET,
    URL: parsed.data.BETTER_AUTH_URL,
  },
  CLIENT_URL: parsed.data.CLIENT_URL,
  AI: {
    GEMINI_API_KEY: parsed.data.GEMINI_API_KEY,
    OPENAI_API_KEY: parsed.data.OPENAI_API_KEY,
  },
  WEB_PUSH: {
    PUBLIC_KEY: parsed.data.VAPID_PUBLIC_KEY,
    PRIVATE_KEY: parsed.data.VAPID_PRIVATE_KEY,
    SUBJECT: parsed.data.VAPID_SUBJECT,
  },
});

export type EnvVars = typeof envVars;
