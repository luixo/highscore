import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_PUSHER_APP_KEY: z.string(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string(),
  PUSHER_APP_ID: z.string(),
  PUSHER_SECRET: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  throw new Error(
    '❌ Invalid environment variables: ' +
      JSON.stringify(_env.error.format(), null, 4),
  );
}
export const env = _env.data;
