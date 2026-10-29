import 'dotenv/config';
import { z } from 'zod';

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  S3_BUCKET: optionalString,
  S3_REGION: z.string().default('ap-south-1'),
  S3_ENDPOINT: optionalString,
  SEED_ADMIN_PASSWORD: optionalString,
  SEED_AUTHOR_PASSWORD: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  aiEnabled: Boolean(parsed.data.OPENAI_API_KEY),
  uploadsEnabled: Boolean(parsed.data.S3_BUCKET),
};
