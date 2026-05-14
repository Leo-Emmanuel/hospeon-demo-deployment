import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const databaseUrlSchema = z
  .string()
  .min(1, 'DATABASE_URL is required')
  .superRefine((value, ctx) => {
    try {
      const url = new URL(value);

      if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL must be a PostgreSQL connection string',
        });
      }

      if (url.hostname === 'host.neon.tech' || value.includes('user:password@')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL still contains a placeholder. Copy the real Neon connection string into Render.',
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL must be a valid connection string',
      });
    }
  });

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: databaseUrlSchema,
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().url('CORS_ORIGIN must be a valid URL').optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
