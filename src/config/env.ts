import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().min(1, 'SUPABASE_JWT_SECRET is required'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  AI_MAX_TOOL_ROUNDS: z.coerce.number().default(4),
  AI_RATE_LIMIT_PER_5MIN: z.coerce.number().default(20),
  DATABASE_URL_TEST: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  // In test env, allow missing DB url by falling back
  if (process.env.NODE_ENV === 'test') {
    // still require core vars for tests? We'll allow test to set them
  }
}

export const env = (parsed.success
  ? parsed.data
  : ({
      PORT: Number(process.env.PORT) || 4000,
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
      DATABASE_URL: process.env.DATABASE_URL || process.env.DATABASE_URL_TEST || '',
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      AI_MAX_TOOL_ROUNDS: Number(process.env.AI_MAX_TOOL_ROUNDS) || 4,
      AI_RATE_LIMIT_PER_5MIN: Number(process.env.AI_RATE_LIMIT_PER_5MIN) || 20,
      DATABASE_URL_TEST: process.env.DATABASE_URL_TEST,
    } as any)) as z.infer<typeof envSchema>;

export const isAiConfigured = (): boolean => Boolean(env.OPENAI_API_KEY);
