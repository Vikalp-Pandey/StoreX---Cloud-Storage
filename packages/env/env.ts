import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

import dotenv from 'dotenv';

dotenv.config({ path: '../../packages/env/.env.local', quiet: true });

const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'staging', 'production', 'test'])
      .default('development'),

    ALLOWED_ORIGINS: z
      .string()
      .transform((value) => value.split(',').map((origin) => origin.trim())),

    DATABASE_URL: z.string(),
    REDIS_URL: z.string().url(),

    PORT: z
      .string()
      .default('5000')
      .transform((value) => Number.parseInt(value, 10)),

    ACCESS_SECRET: z.string().min(32),
    ACCESS_SECRET_TTL: z.string().default('1d'),
    ACCESS_SECRET_TTL_S: z.string().default('86400'),

    SMTP_NAME: z.string(),
    SMTP_MAIL: z.string().email(),
    SMTP_REPLY_TO: z.string().email(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z
      .string()
      .default('587')
      .transform((value) => Number.parseInt(value, 10)),
    SMTP_USERNAME: z.string(),
    SMTP_PASSWORD: z.string(),

    AWS_REGION: z.string().default('eu-north-1'),
    BUCKET_NAME: z.string(),
    SQS_EMAIL_QUEUE_URL: z.string().url(),

    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    GITHUB_REDIRECT_URI: z.string().url(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URI: z.string().url(),

    FGA_API_URL: z.string().url(),
    FGA_STORE_ID: z.string(),
    FGA_MODEL_ID: z.string(),
    FGA_API_TOKEN_ISSUER: z.string().url(),
    FGA_API_AUDIENCE: z.string(),
    FGA_CLIENT_ID: z.string(),
    FGA_CLIENT_SECRET: z.string(),

    STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
    STRIPE_PRO_PRICE_ID: z.string().startsWith('price_'),
    STRIPE_ULTRA_PRICE_ID: z.string().startsWith('price_'),
    APP_URL: z.string().url(),
  },

  runtimeEnv: process.env,
});

export default env;
