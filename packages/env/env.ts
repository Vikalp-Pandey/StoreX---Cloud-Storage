import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

import dotenv from 'dotenv';

dotenv.config({ path: '../../packages/env/.env.local', quiet: true });

const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'staging', 'production'])
      .default('development'),

    VITE_BASE_BACKEND_URL: z.string(),

    ALLOWED_ORIGINS: z
      .string()
      .transform((val) => val.split(',').map((origin) => origin.trim())),

    DATABASE_URL: z.string(),

    PORT: z
      .string()
      .default('5000')
      .transform((val) => parseInt(val, 10)),

    ACCESS_SECRET: z.string(),
    ACCESS_SECRET_TTL: z.string(),
    ACCESS_SECRET_TTL_S: z.string(),

    SMTP_NAME: z.string(),
    SMTP_MAIL: z.string(),
    SMTP_REPLY_TO: z.string(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z
      .string()
      .default('587')
      .transform((val) => parseInt(val, 10)),
    SMTP_USERNAME: z.string(),
    SMTP_PASSWORD: z.string(),

    AWS_REGION: z.string(),
    // Optional here so deployed environments can use an IAM role. The AWS SDK
    // still reads these standard variables automatically for local development.
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_SESSION_TOKEN: z.string().optional(),
    BUCKET_NAME: z.string(),
    SQS_EMAIL_QUEUE_URL: z.string().url(),

    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    GITHUB_REDIRECT_URI: z.string(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URI: z.string(),
  },

  runtimeEnv: process.env,
});

export default env;
