/// <reference types="vite/client" />
import { z } from 'zod';

const defaultApiBaseUrl = import.meta.env.DEV ? 'http://localhost:5000/api/v1' : undefined;

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string()
    .url('VITE_API_BASE_URL must be a valid URL')
    .optional()
    .transform((value) => value || defaultApiBaseUrl)
    .refine(Boolean, 'VITE_API_BASE_URL is required for production builds'),
  VITE_SOCKET_URL: z.string().url('VITE_SOCKET_URL must be a valid URL').optional(),
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
}

if (!_env.success && import.meta.env.PROD) {
  throw new Error('Invalid production environment variables');
}

export const env = _env.success
  ? _env.data
  : { VITE_API_BASE_URL: defaultApiBaseUrl || '', VITE_SOCKET_URL: undefined };
