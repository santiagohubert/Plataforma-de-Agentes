import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 chars'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:4000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  DIFY_API_KEY_ALBIO: z.string().default(''),
  DIFY_API_URL: z.string().url().default('https://api.dify.ai/v1'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment configuration');
  }
  return result.data;
};

export const env = parseEnv();
